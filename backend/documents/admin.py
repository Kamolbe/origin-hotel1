from django.contrib import admin
from django.utils.html import format_html

from .models import Document, FileBlob


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """Faqat ko'rish uchun: hujjatlar API orqali yuklanadi, `file` maydoni ochiq URL bermaydi."""

    list_display = ('original_name', 'kind', 'size', 'uploaded_by', 'guest', 'booking', 'created_at', 'download')
    list_filter = ('kind', 'created_at')
    search_fields = ('original_name', 'title', 'sha256')
    readonly_fields = ('id', 'original_name', 'kind', 'content_type', 'size', 'sha256', 'title',
                       'uploaded_by', 'guest', 'booking', 'created_at')
    exclude = ('file',)
    date_hierarchy = 'created_at'

    @admin.display(description='Yuklab olish')
    def download(self, obj):
        return format_html('<a href="/hotel-api/documents/{}/">PDF</a>', obj.pk)

    def has_add_permission(self, request):
        return False


@admin.register(FileBlob)
class FileBlobAdmin(admin.ModelAdmin):
    list_display = ('name', 'size', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('name', 'data', 'size', 'created_at')

    def has_add_permission(self, request):
        return False
