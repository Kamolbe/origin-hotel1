"""Ishlatilmayotgan fayllarni tozalash buyrug'i.

Ishlatish:
    python backend/manage.py purge_documents
    python backend/manage.py purge_documents --stale-days 90 --dry-run
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from documents.models import Document, FileBlob
from documents.services import purge_orphan_blobs, revoke_document


class Command(BaseCommand):
    help = "Bog‘lanmagan fayl baytlarini va ixtiyoriy ravishda eski bog‘lanmagan hujjatlarni o‘chiradi."

    def add_arguments(self, parser):
        parser.add_argument(
            '--stale-days', type=int, default=0,
            help='Necha kundan eski, mehmon/bron bilan bog‘lanmagan "other" hujjatlar o‘chirilsin (0 — o‘chirilmaydi).',
        )
        parser.add_argument('--dry-run', action='store_true', help='Faqat hisoblaydi, hech narsa o‘chirmaydi.')

    def handle(self, *args, **options):
        stale = Document.objects.none()
        if options['stale_days'] > 0:
            cutoff = timezone.now() - timedelta(days=options['stale_days'])
            stale = Document.objects.filter(
                kind='other', guest__isnull=True, booking__isnull=True, created_at__lt=cutoff,
            )
        stale_count = stale.count()
        used = Document.objects.values_list('file', flat=True)
        orphan_count = FileBlob.objects.exclude(name__in=used).count()

        if options['dry_run']:
            self.stdout.write(f'{stale_count} eski hujjat va {orphan_count} yetim fayl o‘chirilishi mumkin.')
            return

        for document in stale:
            revoke_document(document)
        removed = purge_orphan_blobs()
        self.stdout.write(self.style.SUCCESS(f'{stale_count} eski hujjat va {removed} yetim fayl o‘chirildi.'))
