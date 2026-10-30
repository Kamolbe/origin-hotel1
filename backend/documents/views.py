"""Yopiq (private) PDF hujjatlar API'si.

Endpointlar (barchasi sessiya cookie'si + CSRF bilan ishlaydi):
  GET    /hotel-api/documents/         — ruxsat berilgan hujjatlar ro'yxati (qidiruv, filtr, pagination)
  POST   /hotel-api/documents/         — multipart `file` yuklash (faqat PDF, hajm cheklovi, rate limit)
  GET    /hotel-api/documents/<uuid>/  — faylni yuklab olish (biriktirilgan fayl sifatida)
  DELETE /hotel-api/documents/<uuid>/  — o'chirish (admin yoki yuklagan foydalanuvchi)

Xatolar loyihada qabul qilingan yagona formatda qaytadi: `{"message": "..."}`.
Fayl ochiq URL orqali berilmaydi — har bir so'rov ruxsat tekshiruvidan o'tadi.
"""
import logging

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import Q
from django.http import FileResponse, JsonResponse

from hotel.models import Booking, Guest
from hotel.react_api import endpoint

from .models import Document
from .permissions import can_attach, can_delete, can_view, is_staff
from .services import revoke_document, store_document

logger = logging.getLogger('documents')

PAGE_SIZE = 25


def _method_not_allowed(allowed):
    response = JsonResponse({'message': 'Bu HTTP usuli qo‘llanmaydi.'}, status=405)
    response['Allow'] = allowed
    return response


def _throttle_key(request):
    return f'documents-upload:{request.META.get("REMOTE_ADDR", "")}'


def _resolve(model, value, label):
    """`guest-12` yoki `12` ko'rinishidagi identifikatordan yozuvni topadi."""
    if value in (None, ''):
        return None
    text = str(value).strip()
    if '-' in text:
        text = text.rsplit('-', 1)[-1]
    if not text.isdigit():
        raise ValidationError(f'{label} identifikatori noto‘g‘ri.')
    record = model.objects.filter(pk=int(text)).first()
    if record is None:
        raise ValidationError(f'{label} topilmadi.')
    return record


def _document_payload(document):
    uploader = document.uploaded_by
    return {
        'id': str(document.pk),
        'originalName': document.original_name,
        'kind': document.kind,
        'kindLabel': document.get_kind_display(),
        'size': document.size,
        'title': document.title,
        'sha256': document.sha256,
        'createdAt': document.created_at.isoformat(),
        'guestId': document.guest_id,
        'bookingId': document.booking_id,
        'uploadedBy': (uploader.get_full_name() or uploader.username) if uploader else '',
        'downloadUrl': f'/hotel-api/documents/{document.pk}/',
    }


@endpoint
def collection(request):
    if request.method == 'GET':
        if not request.user.is_authenticated:
            return JsonResponse({'message': 'Hujjatlar ro‘yxati uchun tizimga kiring.'}, status=401)
        documents = Document.objects.select_related('guest', 'booking', 'uploaded_by')
        if not (request.user.is_superuser or is_staff(request.user)):
            documents = documents.filter(
                Q(uploaded_by=request.user) | Q(guest__email__iexact=request.user.email or '')
            )
        kind = request.GET.get('kind', '').strip()
        if kind:
            if kind not in dict(Document.KINDS):
                raise ValidationError('Hujjat turi noto‘g‘ri.')
            documents = documents.filter(kind=kind)
        guest = _resolve(Guest, request.GET.get('guestId'), 'Mehmon')
        if guest is not None:
            documents = documents.filter(guest=guest)
        booking = _resolve(Booking, request.GET.get('bookingId'), 'Bron')
        if booking is not None:
            documents = documents.filter(booking=booking)
        query = request.GET.get('q', '').strip()
        if query:
            documents = documents.filter(Q(original_name__icontains=query) | Q(title__icontains=query))
        try:
            page = max(1, int(request.GET.get('page', 1)))
        except (TypeError, ValueError):
            page = 1
        total = documents.count()
        start = (page - 1) * PAGE_SIZE
        items = [_document_payload(item) for item in documents[start:start + PAGE_SIZE]]
        return JsonResponse({'documents': items, 'total': total, 'page': page, 'pageSize': PAGE_SIZE})

    if request.method != 'POST':
        return _method_not_allowed('GET, POST')

    if not request.user.is_authenticated or not request.user.is_active:
        return JsonResponse({'message': 'Hujjat yuklash uchun tizimga kiring.'}, status=401)

    # Brute-force / disk to'ldirishga qarshi IP bo'yicha cheklov (10 daqiqa oynasi).
    key = _throttle_key(request)
    attempts = cache.get(key, 0)
    if attempts >= settings.MEDIA_UPLOAD_LIMIT:
        logger.warning('document upload throttled ip=%s', request.META.get('REMOTE_ADDR', ''))
        return JsonResponse(
            {'message': 'Juda ko‘p yuklash urinishi. 10 daqiqadan keyin qayta urinib ko‘ring.'},
            status=429,
        )
    cache.set(key, attempts + 1, 600)

    upload = request.FILES.get('file')
    if upload is None:
        raise ValidationError('`file` maydonida PDF yuboring.')

    kind = request.POST.get('kind', 'other').strip() or 'other'
    if kind not in dict(Document.KINDS):
        raise ValidationError('Hujjat turi noto‘g‘ri.')

    guest = _resolve(Guest, request.POST.get('guestId'), 'Mehmon')
    booking = _resolve(Booking, request.POST.get('bookingId'), 'Bron')
    if not can_attach(request.user, guest=guest, booking=booking):
        logger.warning('document attach denied user=%s guest=%s booking=%s', request.user.pk, guest and guest.pk, booking and booking.pk)
        raise PermissionDenied

    document = store_document(
        upload=upload, user=request.user, kind=kind, title=request.POST.get('title', ''),
        guest=guest, booking=booking,
    )
    logger.info('document uploaded id=%s user=%s size=%s', document.pk, request.user.pk, document.size)
    return JsonResponse({'document': _document_payload(document)}, status=201)


@endpoint
def detail(request, pk):
    document = Document.objects.select_related('guest', 'booking', 'uploaded_by').filter(pk=pk).first()
    # Ruxsat yo'q va mavjud emas holatlari bir xil 404 qaytaradi: hujjat bor-yo'qligi oshkor bo'lmaydi.
    if document is None or not can_view(request.user, document):
        logger.warning('document access denied user=%s id=%s', request.user.pk or 'anon', pk)
        return JsonResponse({'message': 'Hujjat topilmadi.'}, status=404)

    if request.method == 'GET':
        response = FileResponse(
            document.file.open('rb'),
            content_type=document.content_type or 'application/pdf',
            as_attachment=True,
            filename=document.original_name,
        )
        response['Cache-Control'] = 'private, no-store'
        response['X-Content-Type-Options'] = 'nosniff'
        logger.info('document downloaded id=%s user=%s', document.pk, request.user.pk)
        return response

    if request.method == 'DELETE':
        if not can_delete(request.user, document):
            raise PermissionDenied
        revoke_document(document)
        logger.info('document deleted id=%s user=%s', pk, request.user.pk)
        return JsonResponse({'deleted': str(pk)})

    return _method_not_allowed('GET, DELETE')
