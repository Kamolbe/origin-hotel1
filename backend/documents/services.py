"""Hujjat bilan ishlash biznes-qoidalari (view qatlamidan mustaqil)."""
import hashlib

from django.core.files.base import ContentFile
from django.db import transaction

from .models import Document, FileBlob
from .validators import validate_document_upload


@transaction.atomic
def store_document(*, upload, user, kind='other', title='', guest=None, booking=None):
    """Tekshirilgan PDF'ni saqlaydi va `Document` yozuvini qaytaradi.

    Baytlar va yozuv bitta tranzaksiyada saqlanadi: xatolik bo'lsa ikkalasi ham
    qaytariladi, ya'ni bazada yarim holatdagi fayl qolmaydi.
    """
    original_name = validate_document_upload(upload)
    upload.seek(0)
    data = upload.read()

    document = Document(
        original_name=original_name,
        kind=kind,
        content_type='application/pdf',
        size=len(data),
        sha256=hashlib.sha256(data).hexdigest(),
        title=(title or '').strip()[:200],
        uploaded_by=user if getattr(user, 'is_authenticated', False) else None,
        guest=guest,
        booking=booking,
    )
    document.file.save(original_name, ContentFile(data), save=False)
    document.full_clean()
    document.save()
    return document


@transaction.atomic
def revoke_document(document):
    """Hujjat yozuvini va unga tegishli baytlarni o'chiradi."""
    name = document.file.name
    document.delete()
    if name:
        FileBlob.objects.filter(name=name).delete()


def purge_orphan_blobs():
    """Bazada hech bir hujjatga bog'lanmagan baytlarni o'chiradi.

    Masalan yuklash yarim yo'lda to'xtaganda yoki hujjat o'chirilganda qolgan
    yozuvlar. Natija: o'chirilgan qatorlar soni.
    """
    used = Document.objects.values_list('file', flat=True)
    deleted, _ = FileBlob.objects.exclude(name__in=used).delete()
    return deleted
