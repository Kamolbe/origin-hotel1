"""Yopiq hujjatlar API'si va tozalash buyrug'i uchun testlar.

Tekshiriladi: PDF validatsiyasi (kengaytma, MIME, sehrli baytlar, hajm), ruxsatlar
(anonim/xodim/mehmon/begona foydalanuvchi), yuklab olish sarlavhalari, o'chirish
huquqi, IP bo'yicha rate limit, CSRF himoyasi va yetim fayllarni tozalash.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import Client, TestCase, override_settings

from hotel.models import Guest

from .models import Document, FileBlob

PDF_BYTES = b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n'


def pdf_upload(name='hujjat.pdf', payload=PDF_BYTES, content_type='application/pdf'):
    return SimpleUploadedFile(name, payload, content_type=content_type)


class DocumentApiTests(TestCase):
    url = '/hotel-api/documents/'

    def setUp(self):
        cache.clear()
        self.admin = get_user_model().objects.create_superuser(
            username='owner@example.test', email='owner@example.test', password='Strong-test-pass-1234')
        self.staff = get_user_model().objects.create_user(
            username='staff@example.test', email='staff@example.test', password='Strong-test-pass-1234')
        group = Group.objects.create(name='Employee')
        group.permissions.set(Permission.objects.filter(
            content_type__app_label='hotel', codename__in=['view_guest', 'view_booking']))
        self.staff.groups.add(group)
        self.guest_user = get_user_model().objects.create_user(
            username='guest@example.test', email='guest@example.test', password='Strong-test-pass-1234')
        self.other_user = get_user_model().objects.create_user(
            username='other@example.test', email='other@example.test', password='Strong-test-pass-1234')
        self.guest = Guest.objects.create(first_name='Test', last_name='Guest', email='guest@example.test')

    def upload(self, user=None, **extra):
        self.client.force_login(user or self.admin)
        return self.client.post(self.url, {'file': pdf_upload(), **extra})

    def test_upload_stores_bytes_in_database_and_downloads_as_attachment(self):
        result = self.upload(kind='guest_document', title='Pasport nusxasi', guestId=f'guest-{self.guest.pk}')
        self.assertEqual(result.status_code, 201, result.content)
        document = Document.objects.get()
        self.assertEqual(document.size, len(PDF_BYTES))
        self.assertEqual(document.guest_id, self.guest.pk)
        self.assertEqual(document.original_name, 'hujjat.pdf')
        # Asl nom saqlash kaliti emas: yo'l tasodifiy UUID'dan iborat.
        self.assertNotIn('hujjat', document.file.name)
        self.assertEqual(FileBlob.objects.get(name=document.file.name).data, PDF_BYTES)

        reply = self.client.get(f'/hotel-api/documents/{document.pk}/')
        self.assertEqual(reply.status_code, 200)
        self.assertEqual(b''.join(reply.streaming_content), PDF_BYTES)
        self.assertIn('attachment', reply['Content-Disposition'])
        self.assertEqual(reply['X-Content-Type-Options'], 'nosniff')
        self.assertIn('no-store', reply['Cache-Control'])

    def test_upload_rejects_wrong_extension_mime_and_magic_bytes(self):
        self.client.force_login(self.admin)
        cases = [
            ('hujjat.exe', PDF_BYTES, 'application/pdf'),
            ('hujjat.pdf', b'<html><script>alert(1)</script></html>', 'application/pdf'),
            ('hujjat.pdf', PDF_BYTES, 'text/html'),
        ]
        for name, payload, content_type in cases:
            result = self.client.post(self.url, {'file': pdf_upload(name, payload, content_type)})
            self.assertEqual(result.status_code, 400, f'{name}/{content_type} -> {result.content}')
            self.assertIn('message', result.json())
        self.assertEqual(Document.objects.count(), 0)

    @override_settings(MEDIA_MAX_DOCUMENT_BYTES=10)
    def test_upload_rejects_oversized_file(self):
        result = self.upload()
        self.assertEqual(result.status_code, 400)
        self.assertEqual(Document.objects.count(), 0)

    def test_anonymous_cannot_upload_list_or_download(self):
        self.assertEqual(self.client.post(self.url, {'file': pdf_upload()}).status_code, 401)
        document = self.upload().json()['document']
        self.client.logout()
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.assertEqual(self.client.get(f'/hotel-api/documents/{document["id"]}/').status_code, 404)

    def test_list_is_scoped_per_role(self):
        document = self.upload(kind='guest_document', guestId=f'guest-{self.guest.pk}').json()['document']

        self.client.force_login(self.staff)
        self.assertEqual(self.client.get(self.url).json()['total'], 1)

        self.client.force_login(self.guest_user)
        self.assertEqual(self.client.get(self.url).json()['documents'][0]['id'], document['id'])
        self.assertEqual(self.client.get(f'/hotel-api/documents/{document["id"]}/').status_code, 200)

        self.client.force_login(self.other_user)
        self.assertEqual(self.client.get(self.url).json()['total'], 0)
        self.assertEqual(self.client.get(f'/hotel-api/documents/{document["id"]}/').status_code, 404)

    def test_guest_cannot_attach_document_to_another_guest(self):
        another = Guest.objects.create(first_name='Other', last_name='Guest', email='stranger@example.test')
        result = self.upload(user=self.guest_user, guestId=f'guest-{another.pk}')
        self.assertEqual(result.status_code, 403)
        self.assertEqual(Document.objects.count(), 0)

    def test_delete_requires_admin_or_uploader(self):
        document = self.upload(kind='guest_document', guestId=f'guest-{self.guest.pk}').json()['document']
        detail = f'/hotel-api/documents/{document["id"]}/'

        self.client.force_login(self.guest_user)
        self.assertEqual(self.client.delete(detail).status_code, 403)

        self.client.force_login(self.admin)
        self.assertEqual(self.client.delete(detail).status_code, 200)
        self.assertEqual(Document.objects.count(), 0)
        self.assertEqual(FileBlob.objects.count(), 0)

    @override_settings(MEDIA_UPLOAD_LIMIT=1)
    def test_upload_is_rate_limited_per_ip(self):
        self.assertEqual(self.upload().status_code, 201)
        self.assertEqual(self.upload().status_code, 429)

    def test_upload_requires_csrf_token(self):
        strict = Client(enforce_csrf_checks=True)
        strict.force_login(self.admin)
        self.assertEqual(strict.post(self.url, {'file': pdf_upload()}).status_code, 403)
        self.assertEqual(Document.objects.count(), 0)

    def test_pagination_and_filters(self):
        self.upload(kind='finance_receipt', title='Chek 1')
        self.upload(kind='other', title='Boshqa')
        self.client.force_login(self.admin)
        self.assertEqual(self.client.get(f'{self.url}?kind=finance_receipt').json()['total'], 1)
        self.assertEqual(self.client.get(f'{self.url}?q=chek').json()['total'], 1)
        page = self.client.get(f'{self.url}?page=2').json()
        self.assertEqual(page['total'], 2)
        self.assertEqual(page['documents'], [])

    def test_purge_command_removes_orphan_blobs_and_keeps_linked_ones(self):
        document = self.upload().json()['document']
        FileBlob.objects.create(name='documents/2026/01/orphan.pdf', data=b'%PDF-', size=5)
        call_command('purge_documents')
        self.assertEqual(FileBlob.objects.count(), 1)
        self.assertTrue(Document.objects.filter(pk=document['id']).exists())
