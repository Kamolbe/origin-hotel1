import json
from django.contrib.auth import get_user_model
from django.test import TestCase
from .permissions import configure_manager
from .models import SiteState, AuditEntry

class VisitDeletionTests(TestCase):
    def setUp(self):
        User=get_user_model()
        self.manager=User.objects.create_user('visit-manager',email='manager@example.test',password='Visit-test-password-8363!');self.manager.groups.add(configure_manager())
        self.owner=User.objects.create_superuser('visit-owner',email='owner@example.test',password='Visit-test-password-8363!')
        self.guest=User.objects.create_user('visit-guest',email='guest@example.test',password='Visit-test-password-8363!')
        self.state,_=SiteState.objects.update_or_create(pk=1,defaults={'payload':{'visits':[{'id':'visit-a','path':'/rooms'},{'id':'visit-b','path':'/'}]}})
    def change(self,key,after=None):
        self.state.refresh_from_db()
        return self.client.patch('/hotel-api/state/',data=json.dumps({'revision':self.state.revision,'changes':[{'collection':'visits','id':key,'after':after}]}),content_type='application/json')
    def test_manager_deletes_only_target_visit_and_records_audit(self):
        self.client.force_login(self.manager)
        result=self.change('visit-a');self.assertEqual(result.status_code,200,result.content)
        self.assertEqual([v['id'] for v in result.json()['data']['visits']],['visit-b'])
        self.assertEqual(get_user_model().objects.count(),3)
        self.assertTrue(AuditEntry.objects.filter(actor=self.manager,details__event='visit_deleted').exists())
    def test_owner_can_also_delete_visits(self):
        self.client.force_login(self.owner);self.assertEqual(self.change('visit-a').status_code,200)
    def test_guests_cannot_delete_visits_and_managers_cannot_forge_records(self):
        self.client.force_login(self.guest);self.assertEqual(self.change('visit-a').status_code,403)
        self.client.force_login(self.manager);self.assertEqual(self.change('visit-a',{'id':'visit-a','path':'forged'}).status_code,403)
        self.state.refresh_from_db();self.assertEqual(len(self.state.payload['visits']),2)
    def test_deleting_old_selection_preserves_new_visits(self):
        self.client.force_login(self.manager)
        self.state.payload['visits'].append({'id':'visit-new','path':'/new'});self.state.save()
        self.assertEqual(self.change('visit-a').status_code,200)
        self.assertEqual(self.change('visit-b').status_code,200)
        self.state.refresh_from_db();self.assertEqual([v['id'] for v in self.state.payload['visits']],['visit-new'])
