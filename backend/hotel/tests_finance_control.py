import json
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from django.utils import timezone
from .models import FinanceEntry, ReportSnapshot, Room
from .permissions import configure_manager

class OwnerFinanceControlTests(TestCase):
    def setUp(self):
        User=get_user_model()
        self.owner=User.objects.create_superuser('owner-finance@example.test',email='owner-finance@example.test',password='Test-owner-long-8363!')
        self.manager=User.objects.create_user('manager-finance@example.test',email='manager-finance@example.test',password='Test-manager-long-8363!');self.manager.groups.add(configure_manager())
        self.guest=User.objects.create_user('guest-finance@example.test',email='guest-finance@example.test')
        self.today=str(timezone.localdate())
        self.entry=FinanceEntry.objects.create(entry_type='income',category='room_revenue',amount=120000,date=self.today,description='Real income')
        self.client.force_login(self.manager)
    def data(self): return self.client.get('/hotel-api/session/').json()
    def patch(self,changes):
        return self.client.patch('/hotel-api/state/',data=json.dumps({'revision':self.data()['revision'],'changes':changes}),content_type='application/json')
    def change(self,kind,key,after):return self.patch([{'collection':kind,'id':key,'after':after}])
    def report(self):return {'id':'report-1','title':'Daily closing','from':self.today,'to':self.today,'summary':{'income':99999999}}
    def test_manager_adds_and_edits_finance_but_delete_denied_even_with_old_permission(self):
        self.assertFalse(self.manager.has_perm('hotel.delete_financeentry'))
        item={'id':'new-income','type':'income','category':'other','amount':45000,'date':self.today,'description':'New income','paymentMethod':'cash'}
        self.assertEqual(self.change('finance',item['id'],item).status_code,200)
        item['amount']=55000;self.assertEqual(self.change('finance',item['id'],item).status_code,200)
        self.manager.user_permissions.add(Permission.objects.get(codename='delete_financeentry'))
        self.assertEqual(self.change('finance',item['id'],None).status_code,403)
        self.assertTrue(FinanceEntry.objects.filter(description='New income',amount=55000).exists())
        self.assertEqual(self.client.post('/management/modules/finance/',{'action':'delete_confirm','selected':[self.entry.pk]}).status_code,403)
    def test_owner_deletes_finance_single_and_bulk_and_audit_is_retained(self):
        self.client.force_login(self.owner)
        ids=[self.entry.pk,FinanceEntry.objects.create(entry_type='expense',category='other',amount=100,date=self.today,description='Expense').pk]
        self.assertEqual(self.patch([{'collection':'finance','id':f'finance-{pk}','after':None} for pk in ids]).status_code,200)
        self.assertEqual(FinanceEntry.objects.count(),0)
        self.assertGreaterEqual(len(self.data()['data']['auditLog']),2)
    def test_report_uses_server_totals_is_immutable_and_only_owner_can_delete(self):
        response=self.change('reports','report-1',self.report());self.assertEqual(response.status_code,200,response.content)
        report=ReportSnapshot.objects.get();self.assertEqual(report.summary['income'],120000);self.assertEqual(report.created_by,self.manager)
        self.assertEqual(self.change('reports','report-1',self.report()).status_code,400)
        self.assertEqual(self.change('reports','report-1',None).status_code,403)
        self.client.force_login(self.owner)
        self.assertEqual(len(self.data()['data']['reports']),1)
        self.assertEqual(self.change('finance',f'finance-{self.entry.pk}',None).status_code,200)
        report.refresh_from_db();self.assertEqual(report.summary['income'],120000)
        self.assertEqual(self.change('reports','report-1',None).status_code,200)
        self.assertEqual(ReportSnapshot.objects.count(),0)
    def test_manager_delete_attempt_rolls_back_other_changes_in_the_batch(self):
        room={'id':'r-test','number':'F901','type':'Standard','floor':1,'capacity':1,'pricePerNight':100000,'status':'available','amenities':[]}
        result=self.patch([{'collection':'rooms','id':room['id'],'after':room},{'collection':'finance','id':f'finance-{self.entry.pk}','after':None}])
        self.assertEqual(result.status_code,403);self.assertFalse(Room.objects.filter(number='F901').exists());self.assertTrue(FinanceEntry.objects.filter(pk=self.entry.pk).exists())
    def test_guest_cannot_create_or_read_reports_and_bad_dates_rejected(self):
        bad={**self.report(),'from':'2026-12-31','to':'2026-01-01'}
        self.assertEqual(self.change('reports','bad',bad).status_code,400)
        self.client.force_login(self.guest)
        self.assertEqual(self.data()['data']['reports'],[])
        self.assertEqual(self.change('reports','forged',self.report()).status_code,403)
