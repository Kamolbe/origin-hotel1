"""Ma'lumotlar bazasida ishlaydigan fayl xotirasi.

Render (va boshqa konteynerli hostinglar) doimiy diskni kafolatlamaydi: yangi deploydan
keyin lokal papkadagi fayllar yo'qoladi. Shu sababli hujjat baytlari baza ichidagi
`documents_fileblob` jadvalida saqlanadi — PostgreSQL'da ham, lokal SQLite'da ham
bir xil ishlaydi va bazaning oddiy zaxira nusxasi bilan birga ko'chadi.
"""
from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


@deconstructible(path='documents.storage.DatabaseStorage')
class DatabaseStorage(Storage):
    """Fayl baytlarini `FileBlob` yozuvlarida saqlovchi Django Storage."""

    def _model(self):
        # Aylanma importni oldini olish uchun model shu yerda olinadi.
        from .models import FileBlob

        return FileBlob

    def _save(self, name, content):
        model = self._model()
        name = self.get_available_name(name)
        content.seek(0)
        data = content.read()
        model.objects.create(name=name, data=data, size=len(data))
        return name

    def _open(self, name, mode='rb'):
        return ContentFile(self._model().objects.get(name=name).data, name=name)

    def exists(self, name):
        return self._model().objects.filter(name=name).exists()

    def delete(self, name):
        self._model().objects.filter(name=name).delete()

    def size(self, name):
        return self._model().objects.values_list('size', flat=True).get(name=name)

    def url(self, name):
        # Ochiq URL berilmaydi: har bir yuklab olish sessiya va ruxsat tekshiruvidan o'tadi.
        raise ValueError('Yopiq hujjatlar uchun to‘g‘ridan-to‘g‘ri URL berilmaydi.')


# Model maydonida ishlatiladigan yagona instansiya (`@deconstructible` tufayli
# migratsiya fayliga ham to'g'ri yoziladi).
media_storage = DatabaseStorage()
