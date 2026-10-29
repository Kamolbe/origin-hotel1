import csv
from datetime import timedelta
from functools import wraps
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.paginator import Paginator
from django.db import IntegrityError, OperationalError, transaction
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_POST
from .forms import RoomForm, GuestForm, BookingForm, FinanceForm, DateRangeForm
from .models import Room, Guest, Booking, FinanceEntry
from .services import audit, period_report, transition_booking

MODULES = {
    'rooms': (Room, RoomForm, 'Xonalar', ['number', 'room_type'], ['Xona', 'Turi', 'Sig‘im', 'Narx / tun', 'Holat']),
    'guests': (Guest, GuestForm, 'Mehmonlar', ['first_name', 'last_name', 'email', 'phone'], ['Mehmon', 'Aloqa', 'Fuqarolik', 'Test pasport', 'Izoh']),
    'bookings': (Booking, BookingForm, 'Bronlar / yashash', ['guest__first_name', 'guest__last_name', 'room__number', 'notes'], ['Bron / Mehmon', 'Xona', 'Sanalar', 'Holat', 'Jami', 'Izoh', 'Haqiqiy kelish / ketish']),
    'finance': (FinanceEntry, FinanceForm, 'Kirim / chiqim', ['description', 'category'], ['Izoh', 'Turi', 'Kategoriya', 'Summa', 'Sana']),
}


def module_config(kind):
    if kind not in MODULES: raise Http404
    return MODULES[kind]


def allowed(user, model, action): return user.has_perm(f'hotel.{action}_{model._meta.model_name}')


def date_range(request):
    today = timezone.localdate()
    return DateRangeForm(request.GET if ('start' in request.GET or 'end' in request.GET) else {'start': today.replace(day=1), 'end': today})


@login_required
def dashboard(request):
    if not request.user.has_perm('hotel.view_room'): raise PermissionDenied
    form = date_range(request)
    summary = period_report(form.cleaned_data['start'], form.cleaned_data['end']) if form.is_valid() else None
    today = timezone.localdate()
    stats = {status: Room.objects.filter(status=status).count() for status, _ in Room.STATUSES}
    return render(request, 'hotel/dashboard.html', {'form': form, 'summary': summary, 'stats': stats, 'total_rooms': Room.objects.count(), 'arrivals': Booking.objects.filter(status='confirmed', check_in=today, checked_in_at__isnull=True).count(), 'departures': Booking.objects.filter(status='confirmed', check_out=today, checked_in_at__isnull=False).count(), 'today': today})


def display_row(kind, obj):
    if kind == 'rooms': return [obj.number, obj.room_type, f'{obj.capacity} kishi', f'{obj.price:,.0f} UZS', obj.get_status_display()]
    if kind == 'guests': return [str(obj), ' · '.join(filter(None, [obj.email, obj.phone])), obj.nationality or '—', obj.passport_number or '—', obj.notes or '—']
    if kind == 'bookings': return [str(obj), str(obj.room), f'{obj.check_in} — {obj.check_out}', obj.get_status_display(), f'{obj.total_amount:,.0f} UZS', obj.notes or 'Izoh qoldirilmagan', f'{timezone.localtime(obj.checked_in_at).strftime("%Y-%m-%d %H:%M") if obj.checked_in_at else "—"} / {timezone.localtime(obj.checked_out_at).strftime("%Y-%m-%d %H:%M") if obj.checked_out_at else "—"}']
    return [obj.description, obj.get_entry_type_display(), obj.get_category_display(), f'{obj.amount:,.0f} UZS', obj.date]


def removable(kind, obj):
    if kind == 'rooms': return not obj.booking_set.exists()
    if kind == 'guests': return not obj.booking_set.filter(status__in=['pending', 'confirmed']).exists()
    if kind == 'bookings': return obj.status in ['completed', 'cancelled']
    return True


@login_required
def module_list(request, kind):
    model, _, title, search_fields, headers = module_config(kind)
    if not allowed(request.user, model, 'view'): raise PermissionDenied
    queryset = model.objects.all()
    if kind == 'guests': queryset = queryset.filter(archived=False)
    query = request.GET.get('q', '').strip()
    if query:
        predicate = Q()
        for field in search_fields: predicate |= Q(**{field + '__icontains': query})
        queryset = queryset.filter(predicate)
    status = request.GET.get('status', '')
    if kind == 'bookings' and status in dict(Booking.STATUSES): queryset = queryset.filter(status=status)
    can_delete = allowed(request.user, model, 'delete')
    confirmation = None
    if request.method == 'POST':
        if not can_delete: raise PermissionDenied
        ids = [int(value) for value in request.POST.getlist('selected') if value.isdecimal()]
        if request.POST.get('select_all_results') == '1': ids = list(queryset.values_list('pk', flat=True))
        selected = list(queryset.filter(pk__in=ids))
        eligible = [obj for obj in selected if removable(kind, obj)]
        if not eligible: messages.warning(request, 'O‘chirish mumkin bo‘lgan yozuv belgilanmagan.')
        elif request.POST.get('action') == 'delete_confirm':
            try:
                with transaction.atomic():
                    for obj in model.objects.select_for_update().filter(pk__in=[item.pk for item in eligible]):
                        if not removable(kind, obj): raise ValidationError('Yozuvga faol bron biriktirildi. Ro‘yxatni yangilang.')
                        audit(request.user, 'archive' if kind == 'guests' else 'delete', obj)
                        if kind == 'guests': obj.archived = True; obj.save(update_fields=['archived'])
                        else: obj.delete()
                messages.success(request, f'{len(eligible)} ta yozuv ' + ('arxivlandi.' if kind == 'guests' else 'o‘chirildi.'))
                return redirect(request.get_full_path())
            except OperationalError: messages.error(request, 'Baza band. Ro‘yxatni yangilab, qayta urinib ko‘ring.')
            except (ProtectedError, ValidationError): messages.error(request, 'Bron bilan bog‘langan yozuvni o‘chirib bo‘lmaydi.')
        else: confirmation = eligible
    paginator = Paginator(queryset, 15)
    page = paginator.get_page(request.GET.get('page', 1))
    records = [{'obj': obj, 'cells': list(zip(headers, display_row(kind, obj))), 'selectable': can_delete and removable(kind, obj), 'check_in': kind == 'bookings' and obj.status == 'confirmed' and not obj.checked_in_at, 'check_out': kind == 'bookings' and obj.status == 'confirmed' and obj.checked_in_at and not obj.checked_out_at} for obj in page]
    params = request.GET.copy(); params.pop('page', None)
    return render(request, 'hotel/list.html', {'kind': kind, 'title': title, 'headers': headers, 'records': records, 'page': page, 'query': query, 'params': params.urlencode(), 'can_delete': can_delete, 'can_edit': allowed(request.user, model, 'change'), 'can_add': allowed(request.user, model, 'add'), 'confirmation': confirmation, 'statuses': Booking.STATUSES if kind == 'bookings' else []})


@login_required
def edit_record(request, kind, pk=None):
    model, form_class, title, _, _ = module_config(kind)
    if not allowed(request.user, model, 'change' if pk else 'add'): raise PermissionDenied
    instance = get_object_or_404(model, pk=pk) if pk else None
    if kind == 'bookings' and instance and (instance.checked_in_at or instance.status not in ['pending', 'confirmed']):
        messages.error(request, 'Joylashtirilgan yoki yakunlangan bron tahrirlanmaydi. Check-out amalidan foydalaning.')
        return redirect('hotel:list', kind=kind)
    form = form_class(request.POST or None, instance=instance)
    if request.method == 'POST':
        try:
            with transaction.atomic():
                if form.is_valid():
                    obj = form.save(commit=False)
                    obj.full_clean()
                    obj.save()
                    audit(request.user, 'update' if pk else 'create', obj)
                    messages.success(request, 'Ma’lumot bazaga saqlandi.')
                    return redirect('hotel:list', kind=kind)
        except ValidationError as exc: form.add_error(None, '; '.join(exc.messages))
        except OperationalError: form.add_error(None, 'Baza band. Qayta saqlashdan oldin ro‘yxatni tekshiring.')
        except IntegrityError: form.add_error(None, 'Takroriy yoki bog‘langan ma’lumot. Qiymatlarni tekshiring.')
    return render(request, 'hotel/form.html', {'form': form, 'title': title, 'kind': kind, 'editing': pk is not None})


@login_required
@require_POST
def booking_action(request, pk, action):
    try: transition_booking(request.user, pk, action); messages.success(request, 'Bron va xona holati yangilandi.')
    except ValidationError as exc: messages.error(request, '; '.join(exc.messages))
    except OperationalError: messages.error(request, 'Baza band. Qayta urinib ko‘ring.')
    except Booking.DoesNotExist: raise Http404
    return redirect('hotel:list', kind='bookings')


@login_required
def reports(request):
    if not request.user.has_perm('hotel.view_financeentry'): raise PermissionDenied
    form = date_range(request)
    summary = period_report(form.cleaned_data['start'], form.cleaned_data['end']) if form.is_valid() else None
    if summary and request.GET.get('format') == 'json':
        return JsonResponse({key: value for key, value in summary.items() if key not in ['entries', 'bookings']})
    if summary and request.GET.get('format') == 'csv':
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="hotel-report.csv"'
        response.write('\ufeff')
        writer = csv.writer(response); writer.writerow(['Sana', 'Turi', 'Kategoriya', 'Izoh', 'Summa'])
        for entry in summary['entries']:
            safe = entry.description if not entry.description.startswith(('=', '+', '-', '@', '\t', '\r')) else "'" + entry.description
            writer.writerow([entry.date, entry.get_entry_type_display(), entry.get_category_display(), safe, entry.amount])
        writer.writerow(['Jami kirim', summary['income']]); writer.writerow(['Jami chiqim', summary['expense']]); writer.writerow(['Sof natija', summary['net']])
        return response
    return render(request, 'hotel/reports.html', {'form': form, 'summary': summary, 'params': request.GET.urlencode()})
