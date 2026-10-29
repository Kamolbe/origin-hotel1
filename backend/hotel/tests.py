from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone
from .forms import BookingForm, FinanceForm, GuestForm, RoomForm
from .models import AuditEntry, Booking, Guest, Room, FinanceEntry, INCOME_CATEGORIES, EXPENSE_CATEGORIES
from .services import period_report, transition_booking

class HotelTests(TestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_superuser(username='admin@test.invalid', password='test-only-password-123')
        self.employee = get_user_model().objects.create_user(username='employee@test.invalid', password='test-only-password-123')
        group = Group.objects.create(name='Employee')
        group.permissions.set(Permission.objects.filter(content_type__app_label='hotel', codename__in=['view_room', 'view_guest', 'add_guest', 'change_guest', 'view_booking', 'add_booking', 'change_booking']))
        self.employee.groups.add(group)
        self.room = Room.objects.create(number='101', room_type='Standard', price=480000, capacity=2)
        self.guest = Guest.objects.create(first_name='Test', last_name='Guest', email='test@example.test')
        self.today = timezone.localdate()
        self.client.force_login(self.admin)
    def booking(self, **updates):
        args = dict(room=self.room, guest=self.guest, check_in=self.today, check_out=self.today + timedelta(days=2), total_amount=960000, status='confirmed')
        args.update(updates)
        b = Booking(**args); b.full_clean(); b.save(); return b
    def test_room_validation_unique_and_positive(self):
        for field, value in [('number', '101'), ('price', '-1'), ('capacity', '0')]:
            payload = {'number':'102','room_type':'Standard','floor':1,'price':'100','capacity':2,'status':'available',field:value}
            self.assertFalse(RoomForm(payload).is_valid())
        with self.assertRaises(IntegrityError), transaction.atomic(): Room.objects.create(number='101', room_type='Standard', price=1, capacity=1)
    def test_guest_synthetic_passport_and_optional_phone(self):
        payload = {'first_name':'A','last_name':'B','passport_number':'TEST-123'}
        self.assertTrue(GuestForm(payload).is_valid())
        payload['passport_number'] = 'AA1234567'; self.assertFalse(GuestForm(payload).is_valid())
        payload['first_name'] = ' '; self.assertFalse(GuestForm(payload).is_valid())
    def test_overlap_rejects_active_and_allows_boundary_cancelled(self):
        first = self.booking()
        with self.assertRaises(ValidationError): self.booking(check_in=self.today + timedelta(days=1))
        self.booking(check_in=first.check_out, check_out=first.check_out + timedelta(days=1))
        first.status='cancelled'; first.save()
        self.booking(check_in=self.today, check_out=self.today + timedelta(days=1))
    def test_bad_dates_capacity_and_past_checkout(self):
        with self.assertRaises(ValidationError): self.booking(check_out=self.today)
        with self.assertRaises(ValidationError): self.booking(adults=3)
        form = BookingForm({'guest':self.guest.pk,'room':self.room.pk,'check_in':'2026-02-30','check_out':'2026-03-02','adults':1,'children':0,'total_amount':100})
        self.assertFalse(form.is_valid())
    def test_checkin_checkout_updates_actual_times_room_and_audit(self):
        b = self.booking()
        with self.assertRaises(ValidationError): transition_booking(self.admin, b.pk, 'check_out')
        transition_booking(self.employee, b.pk, 'check_in')
        b.refresh_from_db(); self.room.refresh_from_db()
        self.assertIsNotNone(b.checked_in_at); self.assertEqual(self.room.status,'occupied')
        with self.assertRaises(ValidationError): transition_booking(self.admin, b.pk, 'check_in')
        transition_booking(self.employee, b.pk, 'check_out')
        b.refresh_from_db(); self.room.refresh_from_db()
        self.assertEqual(b.status,'completed'); self.assertEqual(self.room.status,'cleaning'); self.assertIsNotNone(b.checked_out_at)
        self.assertEqual(AuditEntry.objects.count(),2)
    def test_future_checkin_and_dirty_room_blocked(self):
        b = self.booking(check_in=self.today + timedelta(days=1))
        with self.assertRaises(ValidationError): transition_booking(self.admin,b.pk,'check_in')
        b.check_in=self.today; b.save(); self.room.status='maintenance'; self.room.save()
        with self.assertRaises(ValidationError): transition_booking(self.admin,b.pk,'check_in')
    def test_five_categories_and_finance_validation(self):
        self.assertEqual(len(INCOME_CATEGORIES),5); self.assertEqual(len(EXPENSE_CATEGORIES),5)
        for kind, categories in [('income',INCOME_CATEGORIES),('expense',EXPENSE_CATEGORIES)]:
            for category,_ in categories:
                f=FinanceForm({'entry_type':kind,'category':category,'amount':'100.50','date':str(self.today),'description':'Test'})
                self.assertTrue(f.is_valid(),f.errors); f.save()
        self.assertFalse(FinanceForm({'entry_type':'income','category':'payroll','amount':'100','date':str(self.today),'description':'Test'}).is_valid())
        self.assertFalse(FinanceForm({'entry_type':'expense','category':'utilities','amount':'-1','date':'2026-02-30','description':'Test'}).is_valid())
    def test_inclusive_report_dates_and_checkout_excluded(self):
        self.booking()
        FinanceEntry.objects.create(entry_type='income',category='room_revenue',amount=1000,date=self.today,description='Test')
        FinanceEntry.objects.create(entry_type='expense',category='supplies',amount=250,date=self.today,description='Test')
        FinanceEntry.objects.create(entry_type='income',category='rental',amount=999,date=self.today-timedelta(days=1),description='Outside')
        report=period_report(self.today,self.today)
        self.assertEqual(report['income'],Decimal(1000)); self.assertEqual(report['expense'],Decimal(250)); self.assertEqual(report['net'],Decimal(750)); self.assertEqual(report['room_nights'],1); self.assertEqual(report['occupancy'],100)
        self.assertEqual(period_report(self.today+timedelta(days=2),self.today+timedelta(days=2))['room_nights'],0)
    def test_login_logout_permissions_and_csrf(self):
        self.client.logout(); self.assertEqual(self.client.get('/management/').status_code,302)
        self.assertTrue(self.client.login(username=self.employee.username,password='test-only-password-123'))
        self.assertEqual(self.client.get('/management/').status_code,200)
        self.assertEqual(self.client.post('/management/modules/rooms/new/',{}).status_code,403)
        self.assertEqual(self.client.get('/management/modules/finance/').status_code,403)
        self.assertEqual(self.client.get('/management/reports/').status_code,403)
        self.assertEqual(self.client.post('/management/logout/').status_code,302)
        strict=Client(enforce_csrf_checks=True); strict.force_login(self.admin)
        self.assertEqual(strict.post('/management/modules/guests/new/',{}).status_code,403)
    def test_guest_pagination_search_and_crud_pages(self):
        Guest.objects.bulk_create([Guest(first_name='Synthetic',last_name=f'{i:02}',email=f'g{i}@example.test') for i in range(31)])
        response=self.client.get('/management/modules/guests/')
        self.assertEqual(response.status_code,200); self.assertEqual(len(response.context['records']),15)
        self.assertEqual(len(self.client.get('/management/modules/guests/?page=3').context['records']),2)
        self.assertEqual(self.client.get('/management/modules/guests/?q=g30@').context['page'].paginator.count,1)
        for kind in ['rooms','guests','bookings','finance']:
            self.assertEqual(self.client.get(f'/management/modules/{kind}/').status_code,200)
            self.assertEqual(self.client.get(f'/management/modules/{kind}/new/').status_code,200)
    def test_no_bulk_modal_and_active_deletion_protected(self):
        b=self.booking()
        response=self.client.post('/management/modules/bookings/',{'selected':[b.pk],'action':'delete_confirm'})
        self.assertEqual(response.status_code,200); self.assertTrue(Booking.objects.filter(pk=b.pk).exists())
        self.client.post('/management/modules/rooms/',{'selected':[self.room.pk],'action':'delete_confirm'})
        self.assertTrue(Room.objects.filter(pk=self.room.pk).exists())
        self.client.post('/management/modules/guests/',{'selected':[self.guest.pk],'action':'delete_confirm'})
        self.guest.refresh_from_db(); self.assertFalse(self.guest.archived)
        b.status='cancelled'; b.save()
        entry=FinanceEntry.objects.create(entry_type='income',category='room_revenue',amount=1,date=self.today,description='Retain',booking=b)
        preview=self.client.post('/management/modules/bookings/',{'selected':[b.pk],'action':'delete_preview'})
        self.assertContains(preview,'O‘chirishni tasdiqlash'); self.assertNotContains(preview,'role="dialog"')
        self.client.post('/management/modules/bookings/',{'selected':[b.pk],'action':'delete_confirm'})
        entry.refresh_from_db(); self.assertIsNone(entry.booking_id); self.assertTrue(Guest.objects.filter(pk=self.guest.pk).exists())
    def test_finance_edit_and_report_exports(self):
        entry=FinanceEntry.objects.create(entry_type='income',category='rental',amount=100,date=self.today,description='Before')
        self.client.post(f'/management/modules/finance/{entry.pk}/edit/',{'entry_type':'income','category':'additional_services','amount':200,'date':str(self.today),'description':'After'})
        entry.refresh_from_db(); self.assertEqual(entry.amount,200); self.assertEqual(entry.description,'After')
        result=self.client.get('/management/reports/',{'start':self.today,'end':self.today,'format':'json'})
        self.assertEqual(result.json()['income'],'200.00')
        self.assertEqual(self.client.get('/management/reports/',{'format':'csv'}).status_code,200)
        self.assertContains(self.client.get('/management/reports/',{'start':'2026-02-30','end':str(self.today)}),'errorlist')
