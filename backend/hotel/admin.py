from django.contrib import admin
from .models import Room, Guest, Booking, FinanceEntry, AuditEntry
from .forms import BookingForm, RoomForm, FinanceForm
from .services import audit

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    form = RoomForm
    list_display = ['number', 'room_type', 'capacity', 'price', 'status']
    search_fields = ['number']
    list_filter = ['status', 'room_type']
    def has_delete_permission(self, request, obj=None): return super().has_delete_permission(request, obj) and (obj is None or not obj.booking_set.exists())

@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'phone', 'archived']
    search_fields = ['first_name', 'last_name', 'phone']
    list_filter = ['archived']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    form = BookingForm
    list_display = ['id', 'guest', 'room', 'check_in', 'check_out', 'status']
    readonly_fields = ['checked_in_at', 'checked_out_at', 'status']
    def has_delete_permission(self, request, obj=None): return super().has_delete_permission(request, obj) and (obj is None or obj.status in ['completed', 'cancelled'])
    def has_change_permission(self, request, obj=None): return super().has_change_permission(request, obj) and (obj is None or not obj.checked_in_at)
    actions = None

@admin.register(FinanceEntry)
class FinanceAdmin(admin.ModelAdmin):
    form = FinanceForm
    list_display = ['date', 'entry_type', 'category', 'amount', 'description']
    list_filter = ['entry_type', 'category', 'date']
    search_fields = ['description']

@admin.register(AuditEntry)
class AuditAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'actor', 'action', 'entity', 'entity_id']
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
