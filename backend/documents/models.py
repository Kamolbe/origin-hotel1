"""Yopiq hujjat modellari.

`FileBlob` — faylning xom baytlari (baza ichida, Render'da disk yo'qolsa ham saqlanadi).
`Document` — hujjat metama'lumoti: kim yuklagan, qaysi mehmon/bron bilan bog'liq,
hajmi va SHA-256 nazorat summasi.
"""
import uuid
from datetime import date

from django.conf import settings
from django.db import models

from .storage import media_storage


class FileBlob(models.Model):
    """Fayl baytlari. `name` — storage kaliti (masalan `documents/2026/10/<uuid>.pdf`)."""

    name = models.CharField('Storage kaliti', max_length=255, unique=True)
    data = models.BinaryField('Baytlar')
    size = models.PositiveBigIntegerField('Hajm (bayt)')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Fayl bayti'
        verbose_name_plural = 'Fayl baytlari'

    def __str__(self):
        return self.name


def document_path(instance, filename):
    """Tasodifiy, taxmin qilib bo'lmaydigan saqlash yo'li (asl nom ishlatilmaydi)."""
    today = date.today()
    return f'documents/{today:%Y/%m}/{uuid.uuid4().hex}.pdf'


class Document(models.Model):
    """Bazada saqlanadigan yopiq PDF hujjat."""

    KINDS = [
        ('guest_document', 'Mehmon hujjati'),
        ('booking_document', 'Bron hujjati'),
        ('finance_receipt', 'Moliya cheki'),
        ('other', 'Boshqa hujjat'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Baytlar baza ichida (`FileBlob`) saqlanadi — Render'da disk doimiy emas.
    file = models.FileField('Fayl', storage=media_storage, upload_to=document_path, max_length=255)
    original_name = models.CharField('Asl fayl nomi', max_length=255)
    kind = models.CharField('Turi', max_length=20, choices=KINDS, default='other')
    content_type = models.CharField('MIME turi', max_length=100, default='application/pdf')
    size = models.PositiveBigIntegerField('Hajm (bayt)')
    sha256 = models.CharField('SHA-256 nazorat summasi', max_length=64, db_index=True)
    title = models.CharField('Izoh', max_length=200, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='documents', verbose_name='Yuklagan foydalanuvchi',
    )
    guest = models.ForeignKey(
        'hotel.Guest', on_delete=models.CASCADE, null=True, blank=True,
        related_name='documents', verbose_name='Mehmon',
    )
    booking = models.ForeignKey(
        'hotel.Booking', on_delete=models.CASCADE, null=True, blank=True,
        related_name='documents', verbose_name='Bron',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Hujjat'
        verbose_name_plural = 'Yopiq hujjatlar'
        indexes = [
            models.Index(fields=['guest', 'created_at'], name='document_guest_idx'),
            models.Index(fields=['booking', 'created_at'], name='document_booking_idx'),
        ]

    def __str__(self):
        return f'{self.original_name} · {self.get_kind_display()}'
