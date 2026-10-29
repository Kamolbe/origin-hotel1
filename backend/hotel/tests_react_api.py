import json
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.test import Client, TestCase
from django.utils import timezone
from .models import Room, Guest, Booking, FinanceEntry, SiteState

class ReactApiTests(TestCase):
    def setUp(self):
        self.admin=get_user_model().objects.create_superuser(username='admin@example.test',email='admin@example.test',password='Strong-test-pass-1234')
        self.guest_user=get_user_model().objects.create_user(username='guest@example.test',email='guest@example.test',password='Strong-test-pass-1234')
        self.employee=get_user_model().objects.create_user(username='employee@example.test',email='employee@example.test',password='Strong-test-pass-1234')
        g=Group.objects.create(name='Employee');g.permissions.set(Permission.objects.filter(content_type__app_label='hotel',codename__in=['view_room','view_guest','add_guest','change_guest','view_booking','add_booking','change_booking']));self.employee.groups.add(g)
        self.room=Room.objects.create(number='101',room_type='Standard',price=480000,capacity=2)
        self.guest=Guest.objects.create(first_name='Test',last_name='Guest',email='guest@example.test')
        self.client.force_login(self.admin)
    def session(self): return self.client.get('/hotel-api/session/').json()
    def patch(self,changes,revision=None):
        rev=self.session()['revision'] if revision is None else revision
        return self.client.patch('/hotel-api/state/',data=json.dumps({'revision':rev,'changes':changes}),content_type='application/json')
    def booking(self):
        now=timezone.localdate()
        return {'id':'booking-api','bookingNumber':'API-1','guestId':f'guest-{self.guest.pk}','roomId':f'room-{self.room.pk}','checkIn':str(now),'checkOut':str(now+timedelta(days=2)),'adults':1,'children':0,'status':'confirmed','totalAmount':1,'paidAmount':0,'source':'website','notes':'Test note'}
    def test_snapshot_private_public_and_passwords_stripped(self):
        FinanceEntry.objects.create(entry_type='income',category='rental',amount=10,date=timezone.localdate(),description='Private')
        self.assertIn('no-store',self.client.get('/hotel-api/session/')['Cache-Control'])
        staff=self.session();self.assertEqual(staff['user']['role'],'admin');self.assertEqual(staff['user']['password'],'')
        self.client.logout();public=self.session();self.assertEqual(public['data']['users'],[]);self.assertEqual(public['data']['finance'],[]);self.assertEqual(public['data']['guests'],[])
    def test_server_creates_booking_reprices_overlap_and_atomic_rollback(self):
        after=self.booking();created=self.patch([{'collection':'bookings','id':after['id'],'after':after}]);self.assertEqual(created.status_code,200,created.content)
        self.assertEqual(Booking.objects.get().total_amount,960000)
        after2={**after,'id':'booking-overlap'};self.assertEqual(self.patch([{'collection':'bookings','id':after2['id'],'after':after2}]).status_code,400);self.assertEqual(Booking.objects.count(),1)
        room={**self.session()['data']['rooms'][0],'pricePerNight':123}
        bad=self.patch([{'collection':'rooms','id':room['id'],'after':room},{'collection':'finance','id':'bad','after':{'id':'bad','type':'expense','category':'payroll','amount':-1,'date':'2026-01-01','description':'No'}}]);self.assertEqual(bad.status_code,400);self.room.refresh_from_db();self.assertEqual(self.room.price,480000)
    def test_guest_own_booking_visible_to_another_admin_session(self):
        self.client.force_login(self.guest_user);after=self.booking();after['status']='pending';after['guestNote']='Airport arrival';after['userId']='forged'
        result=self.patch([{'collection':'bookings','id':after['id'],'after':after}]);self.assertEqual(result.status_code,200,result.content)
        self.assertEqual(result.json()['data']['bookings'][0]['userId'],f'user-{self.guest_user.pk}')
        self.client.force_login(self.admin);self.assertEqual(self.session()['data']['bookings'][0]['guestNote'],'Airport arrival')
        other=get_user_model().objects.create_user(username='other@example.test',email='other@example.test',password='Strong-test-pass-1234');self.client.force_login(other)
        data=self.session()['data'];self.assertEqual(data['bookings'],[]);self.assertEqual(data['guests'],[]);self.assertEqual(len(data['unavailableStays']),1)
        self.assertNotIn('guestId',data['unavailableStays'][0])
    def test_employee_checkin_checkout_room_patch_and_room_edit_rejected(self):
        after=self.booking();self.assertEqual(self.patch([{'collection':'bookings','id':after['id'],'after':after}]).status_code,200)
        self.client.force_login(self.employee)
        data=self.session()['data'];b=data['bookings'][0];room=data['rooms'][0]
        denied=self.patch([{'collection':'rooms','id':room['id'],'after':{**room,'pricePerNight':1}}]);self.assertEqual(denied.status_code,403)
        for movement,status in [('checkedInAt','occupied'),('checkedOutAt','cleaning')]:
            data=self.session()['data'];b=data['bookings'][0];room=data['rooms'][0]
            changed={**b,movement:'2026-01-01T00:00:00Z'}
            if movement=='checkedOutAt': changed['status']='completed'
            result=self.patch([{'collection':'bookings','id':b['id'],'after':changed},{'collection':'rooms','id':room['id'],'after':{**room,'status':status}}]);self.assertEqual(result.status_code,200,result.content)
            self.room.refresh_from_db();self.assertEqual(self.room.status,status)
        self.assertNotEqual(Booking.objects.get().checked_in_at.year,2000)
    def test_revision_and_template_changes_invalidate_stale_client(self):
        reply=self.session();self.room.price=700000;self.room.save()
        self.assertEqual(self.patch([],reply['revision']).status_code,409)
    def test_login_register_logout_csrf_and_staff_escalation_rejected(self):
        self.client.logout()
        result=self.client.post('/hotel-api/auth/register/',data=json.dumps({'email':'new@admin.com','password':'Unique-test-pass-1982','firstName':'New','lastName':'Guest'}),content_type='application/json')
        self.assertEqual(result.status_code,200,result.content);self.assertEqual(result.json()['user']['role'],'user')
        own=result.json()['data']['users'][0]
        self.assertEqual(self.patch([{'collection':'users','id':own['id'],'after':{**own,'role':'admin'}}]).status_code,403)
        self.client.post('/hotel-api/auth/logout/',data='{}',content_type='application/json');self.assertIsNone(self.session()['user'])
        logged=self.client.post('/hotel-api/auth/login/',data=json.dumps({'email':'admin@example.test','password':'Strong-test-pass-1234'}),content_type='application/json');self.assertEqual(logged.status_code,200)
        strict=Client(enforce_csrf_checks=True);strict.force_login(self.admin)
        self.assertEqual(strict.patch('/hotel-api/state/',data='{}',content_type='application/json').status_code,403)
    def test_site_settings_saved_and_public_in_another_session(self):
        config={'hotelName':'New hotel','contact':{'phone':'+998000000'},'integrations':{'smtpUser':'private'}}
        result=self.patch([{'collection':'settings','id':'settings','after':config}]);self.assertEqual(result.status_code,200)
        self.client.logout();data=self.session()['data']['settings'];self.assertEqual(data['hotelName'],'New hotel');self.assertNotIn('integrations',data)
    def test_visit_identity_is_server_supplied_and_never_public(self):
        result=self.client.post('/hotel-api/visit/',data=json.dumps({'path':'/app','device':'Mobil','browser':'Test','userId':'forged'}),content_type='application/json')
        self.assertEqual(result.status_code,200);self.assertEqual(result.json()['data']['visits'][0]['userId'],f'user-{self.admin.pk}')
        self.client.logout();self.assertEqual(self.session()['data']['visits'],[])
    def test_proxy_csrf_trusted_origin(self):
        strict=Client(enforce_csrf_checks=True);strict.force_login(self.admin)
        with self.settings(ALLOWED_HOSTS=['api.example.test'],CSRF_TRUSTED_ORIGINS=['https://hotel.example.test']):
            reply=strict.get('/hotel-api/session/',HTTP_HOST='api.example.test',secure=True).json()
            result=strict.patch('/hotel-api/state/',data=json.dumps({'revision':reply['revision'],'changes':[]}),content_type='application/json',HTTP_HOST='api.example.test',HTTP_ORIGIN='https://hotel.example.test',HTTP_X_CSRFTOKEN=reply['csrfToken'],secure=True)
            self.assertEqual(result.status_code,200,result.content)
    def test_archived_guest_keeps_booking_history_but_cannot_be_rebooked(self):
        now=timezone.localdate()
        booking=Booking.objects.create(guest=self.guest,room=self.room,check_in=now-timedelta(days=2),check_out=now-timedelta(days=1),total_amount=1,status='completed')
        key=f'guest-{self.guest.pk}'
        result=self.patch([{'collection':'guests','id':key,'after':None}]);self.assertEqual(result.status_code,200)
        record=next(item for item in self.session()['data']['guests'] if item['id']==key);self.assertTrue(record['archived'])
        self.assertEqual(self.session()['data']['bookings'][0]['guestId'],key)
        after=self.booking();self.assertEqual(self.patch([{'collection':'bookings','id':after['id'],'after':after}]).status_code,400)
    def test_malformed_change_is_validation_error(self):
        self.assertEqual(self.patch([{'collection':'rooms','id':'x','after':[]}]).status_code,400)
