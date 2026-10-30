"""Yuklanayotgan fayl uchun qat'iy tekshiruvlar.

Uchta mustaqil tekshiruv birga ishlaydi, chunki har biri alohida aldanishi mumkin:
1) kengaytma (`.pdf`) — foydalanuvchi niyati;
2) brauzer bergan MIME (`application/pdf`) — yuklash formasi;
3) fayl boshidagi sehrli baytlar (`%PDF-`) — haqiqiy mazmun.
Fayl nomi hech qachon disk/baza kaliti sifatida ishlatilmaydi (u tasodifiy UUID),
shuning uchun `../../` yoki boshqaruv belgilari bilan yo'l chetlab o'tish mumkin emas.
"""
import os
import unicodedata

from django.conf import settings
from django.core.exceptions import ValidationError

PDF_MAGIC = b'%PDF-'
PDF_EXTENSIONS = {'.pdf'}
# Ba'zi brauzerlar va eski mijozlar PDF'ni umumiy tur bilan yuboradi.
ALLOWED_CONTENT_TYPES = {'', 'application/pdf', 'application/x-pdf', 'application/octet-stream'}


def clean_filename(value):
    """Foydalanuvchi bergan nomni faqat ko'rsatish uchun xavfsiz ko'rinishga keltiradi."""
    name = os.path.basename(str(value or '').replace('\\', '/'))
    name = unicodedata.normalize('NFKC', name)
    name = ''.join(char for char in name if char.isprintable()).strip(' .')
    return (name or 'hujjat.pdf')[:255]


def validate_document_upload(upload):
    """`upload` PDF ekanini tekshiradi va tozalangan asl fayl nomini qaytaradi."""
    name = clean_filename(getattr(upload, 'name', ''))
    if os.path.splitext(name)[1].lower() not in PDF_EXTENSIONS:
        raise ValidationError('Faqat PDF hujjat yuklash mumkin.')

    limit = settings.MEDIA_MAX_DOCUMENT_BYTES
    size = getattr(upload, 'size', None)
    if not size:
        raise ValidationError('Bo‘sh fayl yuborildi.')
    if size > limit:
        raise ValidationError(f'Hujjat hajmi {limit // (1024 * 1024)} MB dan oshmasin.')

    content_type = (getattr(upload, 'content_type', '') or '').split(';')[0].strip().lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError('Fayl turi PDF emas.')

    upload.seek(0)
    head = upload.read(len(PDF_MAGIC))
    upload.seek(0)
    if head != PDF_MAGIC:
        raise ValidationError('Fayl mazmuni PDF formatiga mos emas.')

    return name
