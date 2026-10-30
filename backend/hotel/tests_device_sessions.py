import json
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.test import Client, TestCase
from .models import ManagerDeviceSession, AuditEntry
from .permissions import configure_manager

class ManagerDeviceTests(TestCase):
    def setUp(self):
        User=get_user_model()
        self.owner=User.objects.create_superuser('owner-device@example.test','owner-device@example.test','Strong-device-pass-8363!')
        self.manager=User.objects.create_user('manager-device@example.test',email='manager-device@example.test',password='Strong-device-pass-8363!');self.manager.groups.add(configure_manager())
        self.other=User.objects.create_user('other-device@example.test',email='other-device@example.test',password='Strong-device-pass-8363!');self.other.groups.add(configure_manager())
        self.client.force_login(self.owner)
    def login_device(self,user,index=0):
        client=Client(HTTP_USER_AGENT=f'Mozilla/5.0 (Windows NT 10.0) Chrome/12{index}.0')
        response=client.post('/hotel-api/auth/login/',data=json.dumps({'email':user.email,'password':'Strong-device-pass-8363!'}),content_type='application/json')
        self.assertEqual(response.status_code,200,response.content)
        return client
    def manager_key(self):
        return next(u['id'] for u in self.client.get('/hotel-api/session/').json()['data']['users'] if u['email']==self.manager.email)
    def revoke(self,**values):
        return self.client.post('/hotel-api/manager-sessions/',data=json.dumps({'managerId':self.manager_key(),**values}),content_type='application/json')
    def test_five_sessions_revoke_one_then_all_without_affecting_other_manager(self):
        clients=[self.login_device(self.manager,i) for i in range(5)];other=self.login_device(self.other)
        reply=self.client.get('/hotel-api/manager-sessions/').json()
        own=[s for s in reply['sessions'] if s['managerId']==self.manager_key()]
        self.assertEqual(len(own),5)
        self.assertTrue(all('session_key' not in s and 'sessionId' not in s for s in own))
        self.assertEqual(self.revoke(sessionId=own[0]['id']).json()['revoked'],1)
        self.assertEqual(sum(c.get('/hotel-api/session/').json()['user'] is not None for c in clients),4)
        self.assertEqual(self.revoke(all=True).json()['revoked'],4)
        for c in clients:
            self.assertIsNone(c.get('/hotel-api/session/').json()['user'])
            self.assertEqual(c.patch('/hotel-api/state/',data='{}',content_type='application/json').status_code,403)
        self.assertIsNotNone(other.get('/hotel-api/session/').json()['user'])
        self.assertEqual(ManagerDeviceSession.objects.filter(user=self.manager).count(),0)
        self.assertEqual(AuditEntry.objects.filter(action='manager sessions revoked').count(),2)
        self.assertIsNotNone(self.login_device(self.manager).get('/hotel-api/session/').json()['user'])
    def test_only_admin_and_target_scope(self):
        self.login_device(self.manager);self.login_device(self.other)
        foreign=ManagerDeviceSession.objects.get(user=self.other)
        self.assertEqual(self.revoke(sessionId=str(foreign.pk)).json()['revoked'],0)
        self.assertTrue(Session.objects.filter(pk=foreign.session_id).exists())
        manager=Client();manager.force_login(self.manager)
        self.assertEqual(manager.get('/hotel-api/manager-sessions/').status_code,403)
        self.assertEqual(manager.post('/hotel-api/manager-sessions/',data='{}',content_type='application/json').status_code,403)
        self.assertEqual(Client().get('/hotel-api/manager-sessions/').status_code,403)
    def test_import_previous_session_and_expiry(self):
        old=Client();old.force_login(self.manager)
        self.assertEqual(ManagerDeviceSession.objects.count(),0)
        items=self.client.get('/hotel-api/manager-sessions/').json()['sessions']
        self.assertEqual(len(items),1);self.assertTrue(items[0]['legacy'])
        old.logout()
        self.assertEqual(len(self.client.get('/hotel-api/manager-sessions/').json()['sessions']),0)
    def test_csrf_required_for_revocation(self):
        client=Client(enforce_csrf_checks=True);client.force_login(self.owner)
        self.assertEqual(client.post('/hotel-api/manager-sessions/',data='{}',content_type='application/json').status_code,403)

    def test_changed_password_sessions_are_not_counted_as_valid_devices(self):
        self.login_device(self.manager)
        self.manager.set_password('Different-device-password-8363!');self.manager.save()
        self.assertEqual(self.client.get('/hotel-api/manager-sessions/').json()['sessions'],[])
