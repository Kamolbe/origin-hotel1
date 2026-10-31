import json
from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from .models import AuditEntry, SiteState, Room, Guest, Booking
from .permissions import configure_manager
from django.utils import timezone
from datetime import timedelta

class OwnerHistoryTests(TestCase):
    def setUp(self):
        User=get_user_model()
        self.owner=User.objects.create_superuser('history-owner','owner@example.test','History-test-password-8363!')
        self.manager=User.objects.create_user('history-manager',email='manager@example.test',password='History-test-password-8363!');self.manager.groups.add(configure_manager())
        self.guest=User.objects.create_user('history-guest',email='guest@example.test',password='History-test-password-8363!')
        self.records=[AuditEntry.objects.create(actor=self.guest,action='login',entity='user',entity_id=str(self.guest.pk)) for _ in range(2)]
        self.client.force_login(self.owner)
    def remove(self,ids):return self.client.post('/hotel-api/account-history/',data=json.dumps({'ids':ids}),content_type='application/json')
    def test_owner_deletes_only_selected_history_without_removing_account(self):
        result=self.remove([str(self.records[0].pk)])
        self.assertEqual(result.status_code,200,result.content)
        self.assertFalse(AuditEntry.objects.filter(pk=self.records[0].pk).exists())
        self.assertTrue(AuditEntry.objects.filter(pk=self.records[1].pk).exists())
        self.assertTrue(get_user_model().objects.filter(pk=self.guest.pk).exists())
        self.assertEqual(AuditEntry.objects.filter(details__event='account_history_deleted').count(),1)
    def test_manager_guest_and_anonymous_cannot_delete_history(self):
        for actor in [self.manager,self.guest]:
            self.client.force_login(actor);self.assertEqual(self.remove([str(self.records[0].pk)]).status_code,403)
        self.client.logout();self.assertEqual(self.remove([str(self.records[0].pk)]).status_code,403)
        self.assertTrue(AuditEntry.objects.filter(pk=self.records[0].pk).exists())
    def test_invalid_and_too_many_ids_rejected(self):
        for ids in ['all',[1],['invalid'],['1']*1001]:self.assertEqual(self.remove(ids).status_code,400)
    def test_admin_account_deletion_preserves_bookings_and_cannot_delete_admin(self):
        room=Room.objects.create(number='H1',room_type='Standard',price=100,capacity=2)
        guest=Guest.objects.create(first_name='History',last_name='Guest',email=self.guest.email)
        today=timezone.localdate();booking=Booking.objects.create(room=room,guest=guest,check_in=today+timedelta(days=1),check_out=today+timedelta(days=2),total_amount=100)
        def delete_account(pk):
            revision=self.client.get('/hotel-api/session/').json()['revision']
            return self.client.patch('/hotel-api/state/',data=json.dumps({'revision':revision,'changes':[{'collection':'users','id':f'user-{pk}','after':None}]}),content_type='application/json')
        self.assertEqual(delete_account(self.owner.pk).status_code,403)
        self.assertEqual(delete_account(self.guest.pk).status_code,200)
        self.assertTrue(Booking.objects.filter(pk=booking.pk).exists())
        self.assertTrue(Guest.objects.filter(pk=guest.pk).exists())
    def test_csrf_required(self):
        client=Client(enforce_csrf_checks=True);client.force_login(self.owner)
        self.assertEqual(client.post('/hotel-api/account-history/',data='{"ids":[]}',content_type='application/json').status_code,403)
