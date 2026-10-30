import json
from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.utils import timezone
from .models import StaffMember, SalaryPayment, FinanceEntry, SiteState, Room
from .permissions import configure_manager

class StaffAndManagerTests(TestCase):
    def setUp(self):
        User=get_user_model()
        self.admin=User.objects.create_superuser('owner@example.test','owner@example.test','Long-owner-pass-8363')
        self.manager=User.objects.create_user('manager@example.test',email='manager@example.test',password='Long-manager-pass-8363');self.manager.groups.add(configure_manager())
        self.guest=User.objects.create_user('guest@example.test',email='guest@example.test',password='Long-guest-pass-8363')
        self.client.force_login(self.admin)
    def session(self): return self.client.get('/hotel-api/session/').json()
    def change(self,kind,key,after):
        return self.client.patch('/hotel-api/state/',data=json.dumps({'revision':self.session()['revision'],'changes':[{'collection':kind,'id':key,'after':after}]}),content_type='application/json')
    def employee(self):
        return {'id':'employee-test','name':'Test Worker','jobTitle':'Qabulxona','phone':'+998901234567','email':'','monthlySalary':2500000,'startDate':str(timezone.localdate().replace(day=1)),'payday':1,'notes':'Test','isActive':True}
    def test_owner_employee_salary_atomic_and_private(self):
        item=self.employee();self.assertEqual(self.change('employees',item['id'],item).status_code,200)
        period=timezone.localdate().strftime('%Y-%m')
        response=self.change('salaryPayments','salary-1',{'id':'salary-1','employeeId':item['id'],'period':period,'amount':1})
        self.assertEqual(response.status_code,200,response.content)
        self.assertEqual(SalaryPayment.objects.get().amount,2500000)
        self.assertEqual(FinanceEntry.objects.get().amount,2500000)
        self.assertEqual(self.change('salaryPayments','salary-2',{'employeeId':item['id'],'period':period}).status_code,400)
        self.assertEqual(FinanceEntry.objects.count(),1)
        self.assertEqual(self.change('employees',item['id'],None).status_code,200)
        self.assertFalse(StaffMember.objects.get().is_active)
        self.assertEqual(SalaryPayment.objects.count(),1)
        for user in [self.manager,self.guest]:
            self.client.force_login(user);data=self.session()['data'];self.assertEqual(data['employees'],[]);self.assertEqual(data['salaryPayments'],[])
            self.assertEqual(self.change('employees','other',item).status_code,403)
            self.assertEqual(self.change('salaryPayments','forged',{'employeeId':item['id'],'period':period}).status_code,403)
    def test_manager_has_old_operational_permissions_without_owner_privileges(self):
        self.client.force_login(self.manager)
        room={'id':'new-room','number':'M101','type':'Standard','floor':1,'capacity':2,'pricePerNight':100000,'status':'available','amenities':[]}
        self.assertEqual(self.change('rooms',room['id'],room).status_code,200)
        self.assertEqual(self.change('settings','settings',{'hotelName':'Manager hotel'}).status_code,200)
        user={'id':'new-account','name':'New Guest','email':'new@example.test','password':'Unique-long-pass-7363','role':'user','isActive':True}
        self.assertEqual(self.change('users',user['id'],user).status_code,200)
        user.update(id='forged-admin',email='forged@example.test',role='admin')
        self.assertEqual(self.change('users',user['id'],user).status_code,403)
        self.assertFalse(get_user_model().objects.filter(email='forged@example.test').exists())
        self.assertEqual(self.change('users',f'user-{self.admin.pk}',None).status_code,403)
    def test_salary_generated_finance_cannot_be_deleted_by_manager(self):
        item=self.employee();self.change('employees',item['id'],item)
        self.change('salaryPayments','p1',{'employeeId':item['id'],'period':timezone.localdate().strftime('%Y-%m')})
        self.client.force_login(self.manager)
        finance=self.session()['data']['finance'][0]
        self.assertEqual(self.change('finance',finance['id'],None).status_code,400)
        entry=FinanceEntry.objects.get();entry.amount=1
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError): entry.full_clean()
    def test_due_reminder_is_readable_only_by_owner_and_read_flag_persists(self):
        item=self.employee();self.change('employees',item['id'],item)
        notes=self.session()['data']['notifications'];note=next(note for note in notes if note['id'].startswith('payroll-due'))
        self.assertFalse(note['read'])
        self.assertEqual(self.change('notifications',note['id'],{**note,'read':True}).status_code,200)
        self.assertTrue(next(note for note in self.session()['data']['notifications'] if note['id'].startswith('payroll-due'))['read'])
        self.client.force_login(self.manager);self.assertFalse(any(note['id'].startswith('payroll-due') for note in self.session()['data']['notifications']))
    def test_google_profile_required_survives_reload_and_blocks_writes(self):
        self.client.logout()
        profile={'email':'google@example.test','email_verified':True,'iss':'https://securetoken.google.com/origin-hotel','sub':'verified-google-id','name':'Google Name'}
        with patch('google.oauth2.id_token.verify_firebase_token',return_value=profile):
            reply=self.client.post('/hotel-api/auth/google/',data=json.dumps({'idToken':'test-token'}),content_type='application/json')
        self.assertEqual(reply.status_code,200,reply.content)
        self.assertTrue(self.session()['user']['profileRequired'])
        self.assertEqual(self.change('users',self.session()['user']['id'],self.session()['user']).status_code,400)
        for phone in ['', 'abc', '123']:
            result=self.client.post('/hotel-api/auth/complete-profile/',data=json.dumps({'firstName':'Test','lastName':'Google','phone':phone,'confirmed':True}),content_type='application/json');self.assertEqual(result.status_code,400)
        result=self.client.post('/hotel-api/auth/complete-profile/',data=json.dumps({'firstName':'Test','lastName':'Google','phone':'+998 90 123 45 67','confirmed':True}),content_type='application/json')
        self.assertEqual(result.status_code,200,result.content);self.assertFalse(self.session()['user']['profileRequired']);self.assertEqual(self.session()['user']['phone'],'+998901234567')
    def test_guest_cannot_choose_manager_login(self):
        self.client.logout()
        result=self.client.post('/hotel-api/auth/login/',data=json.dumps({'email':self.guest.email,'password':'Long-guest-pass-8363','portal':'manager'}),content_type='application/json')
        self.assertEqual(result.status_code,403)
        self.assertIsNone(self.session()['user'])

    def test_manager_bootstrap_is_idempotent_and_does_not_promote_regular_email(self):
        from django.core.management import call_command
        from django.core.management.base import CommandError
        from django.contrib.auth.models import Group
        import os
        Group.objects.filter(name='Manager').delete()
        with patch.dict(os.environ,{'HOTEL_BOOTSTRAP_MANAGER_EMAIL':'bootstrap@example.test','HOTEL_BOOTSTRAP_MANAGER_PASSWORD':'Test-bootstrap-secret-8363!'}):
            call_command('bootstrap_manager',verbosity=0)
            user=get_user_model().objects.get(email='bootstrap@example.test')
            self.assertTrue(user.groups.filter(name='Manager').exists());self.assertFalse(user.is_superuser)
            original=user.password;call_command('bootstrap_manager',verbosity=0);user.refresh_from_db();self.assertEqual(user.password,original)
        user.groups.clear()
        with patch.dict(os.environ,{'HOTEL_BOOTSTRAP_MANAGER_EMAIL':self.guest.email,'HOTEL_BOOTSTRAP_MANAGER_PASSWORD':'Test-bootstrap-secret-8363!'}):
            with self.assertRaises(CommandError): call_command('bootstrap_manager',verbosity=0)
