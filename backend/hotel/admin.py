from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from .admin_lock import SerializedHotelWrites
from django.contrib import admin
from .models import Room, Guest, Booking, FinanceEntry, AuditEntry, StaffMember, SalaryPayment, ReportSnapshot
from .forms import BookingForm, RoomForm, FinanceForm
from .services import audit

@admin.register(Room)
class RoomAdmin(SerializedHotelWrites, admin.ModelAdmin):
    form = RoomForm
    list_display = ['number', 'room_type', 'capacity', 'price', 'status']
    search_fields = ['number']
    list_filter = ['status', 'room_type']
    def has_delete_permission(self, request, obj=None): return super().has_delete_permission(request, obj) and (obj is None or not obj.booking_set.exists())

@admin.register(Guest)
class GuestAdmin(SerializedHotelWrites, admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'phone', 'archived']
    search_fields = ['first_name', 'last_name', 'phone']
    list_filter = ['archived']

@admin.register(Booking)
class BookingAdmin(SerializedHotelWrites, admin.ModelAdmin):
    form = BookingForm
    list_display = ['id', 'guest', 'room', 'check_in', 'check_out', 'status']
    readonly_fields = ['checked_in_at', 'checked_out_at', 'status']
    def has_delete_permission(self, request, obj=None): return super().has_delete_permission(request, obj) and (obj is None or obj.status in ['completed', 'cancelled'])
    def has_change_permission(self, request, obj=None): return super().has_change_permission(request, obj) and (obj is None or not obj.checked_in_at)
    actions = None

@admin.register(FinanceEntry)
class FinanceAdmin(SerializedHotelWrites, admin.ModelAdmin):
    def has_delete_permission(self,request,obj=None): return request.user.is_superuser
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

admin.site.unregister(get_user_model())
@admin.register(get_user_model())
class HotelUserAdmin(SerializedHotelWrites, UserAdmin):
    pass

@admin.register(StaffMember)
class StaffMemberAdmin(SerializedHotelWrites, admin.ModelAdmin):
    list_display = ['name','job_title','monthly_salary','payday','start_date','is_active']
    search_fields = ['name','job_title','phone']
    def has_module_permission(self,request): return request.user.is_superuser
    def has_view_permission(self,request,obj=None): return request.user.is_superuser
    def has_change_permission(self,request,obj=None): return request.user.is_superuser
    def has_add_permission(self,request): return request.user.is_superuser
    def has_delete_permission(self,request,obj=None): return request.user.is_superuser

@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = ['employee','period','amount','paid_at']
    def has_module_permission(self,request): return request.user.is_superuser
    def has_view_permission(self,request,obj=None): return request.user.is_superuser
    def has_add_permission(self,request): return False
    def has_change_permission(self,request,obj=None): return False
    def has_delete_permission(self,request,obj=None): return False

@admin.register(ReportSnapshot)
class ReportSnapshotAdmin(SerializedHotelWrites, admin.ModelAdmin):
    list_display = ['title','start_date','end_date','created_by','created_at']
    def has_add_permission(self,request): return False
    def has_change_permission(self,request,obj=None): return False
    def has_delete_permission(self,request,obj=None): return request.user.is_superuser
    def has_view_permission(self,request,obj=None): return request.user.is_superuser
