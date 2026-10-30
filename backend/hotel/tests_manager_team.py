from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from django.test import TransactionTestCase, Client
from django.db import connections, close_old_connections
from .models import SiteState
import json
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.db import transaction
from django.utils import timezone
from .models import Room, Guest, Booking, AuditEntry
from .permissions import configure_manager, manager_accounts

class ManagerTeamTests(TestCase):
    def setUp(self):
        User=get_user_model();self.owner=User.objects.create_superuser('team-owner',email='team-owner@example.test',password='Team-test-password-8363!')
        self.client.force_login(self.owner)
    def session(self):return self.client.get('/hotel-api/session/').json()
    def changes(self,changes,revision=None):return self.client.patch('/hotel-api/state/',data=json.dumps({'revision':self.session()['revision'] if revision is None else revision,'changes':changes}),content_type='application/json')
    def change(self,kind,key,after,revision=None):return self.changes([{'collection':kind,'id':key,'after':after}],revision)
    def create_manager(self,index):
        item={'id':f'team-manager-{index}','name':f'Manager {index}','email':f'team-manager-{index}@example.test','password':'Unique-team-password-8363!','role':'manager','isActive':True}
        response=self.change('users',item['id'],item)
        return response,item
    def test_limit_counts_blocked_accounts_and_deletion_frees_slot(self):
        for i in range(3):self.assertEqual(self.create_manager(i)[0].status_code,200)
        response=self.create_manager(3)[0];self.assertEqual(response.status_code,400);self.assertFalse(get_user_model().objects.filter(email='team-manager-3@example.test').exists())
        manager=next(user for user in self.session()['data']['users'] if user['email']=='team-manager-0@example.test')
        manager['isActive']=False;self.assertEqual(self.change('users',manager['id'],manager).status_code,200)
        self.assertEqual(self.create_manager(3)[0].status_code,400)
        self.assertEqual(self.change('users',manager['id'],None).status_code,200)
        self.assertEqual(self.create_manager(3)[0].status_code,200);self.assertEqual(manager_accounts().count(),3)
    def test_manager_cannot_create_block_or_delete_other_manager(self):
        self.create_manager(0);self.create_manager(1)
        data=self.session()['data'];target=next(user for user in data['users'] if user['email']=='team-manager-1@example.test')
        user=get_user_model().objects.get(email='team-manager-0@example.test');self.client.force_login(user)
        self.assertEqual(self.create_manager(2)[0].status_code,403)
        target['isActive']=False;self.assertEqual(self.change('users',target['id'],target).status_code,403)
        self.assertEqual(self.change('users',target['id'],None).status_code,403)
    def test_group_assignment_and_multi_add_batch_cannot_bypass_limit(self):
        self.create_manager(0);self.create_manager(1);group=configure_manager()
        u=get_user_model().objects.create_user('direct-third');u.groups.add(group)
        fourth=get_user_model().objects.create_user('direct-fourth')
        with self.assertRaises(ValidationError), transaction.atomic(): fourth.groups.add(group)
        self.assertEqual(manager_accounts().count(),3)
        # An attempted promotion in the same batch must not bypass the global state lock.
        candidate={'id':f'user-{fourth.pk}','name':'Fourth','email':'fourth@example.test','password':'Unique-team-password-8363!','role':'manager','isActive':True}
        self.assertEqual(self.change('users',candidate['id'],candidate).status_code,400)
    def test_five_requests_one_approval_is_seen_by_all_three_and_read_independently(self):
        for i in range(3):self.create_manager(i)
        managers=[get_user_model().objects.get(email=f'team-manager-{i}@example.test') for i in range(3)]
        guest_user=get_user_model().objects.create_user('team-guest',email='team-guest@example.test')
        guest=Guest.objects.create(first_name='Synthetic',last_name='Guest',email=guest_user.email)
        room=Room.objects.create(number='TEAM-101',room_type='Standard',price=100000,capacity=2)
        today=timezone.localdate();self.client.force_login(guest_user)
        for i in range(5):
            item={'id':f'team-booking-{i}','bookingNumber':f'TEAM-{i}','guestId':f'guest-{guest.pk}','roomId':f'room-{room.pk}','checkIn':str(today+timedelta(days=i*2)),'checkOut':str(today+timedelta(days=i*2+1)),'status':'pending','adults':1,'children':0,'totalAmount':1}
            self.assertEqual(self.change('bookings',item['id'],item).status_code,200)
        for manager in managers:
            self.client.force_login(manager);self.assertEqual(sum(note['title']=='Yangi bron' for note in self.session()['data']['notifications']),5)
        stale=self.session()['revision']
        self.client.force_login(managers[0]);booking=next(item for item in self.session()['data']['bookings'] if item['id']=='team-booking-0')
        booking.update(status='confirmed',expectedStatus='pending')
        self.assertEqual(self.change('bookings',booking['id'],booking).status_code,200)
        self.client.force_login(managers[1]);self.assertEqual(self.change('bookings',booking['id'],booking,stale).status_code,409)
        self.assertEqual(self.change('bookings',booking['id'],booking).status_code,400)
        for manager in managers:
            self.client.force_login(manager);reply=self.session();self.assertEqual(sum(item['status']=='pending' for item in reply['data']['bookings']),4)
            handled=next(item for item in reply['data']['bookings'] if item['id']=='team-booking-0');self.assertEqual(handled['lastHandledByName'],'Manager 0')
            notices=[note for note in reply['data']['notifications'] if note['title']=='Bron tasdiqlandi'];self.assertEqual(len(notices),1);self.assertIn('Manager 0',notices[0]['message']);self.assertFalse(notices[0]['read'])
        self.client.force_login(managers[0]);note=next(note for note in self.session()['data']['notifications'] if note['title']=='Bron tasdiqlandi');self.change('notifications',note['id'],{**note,'read':True})
        self.client.force_login(managers[1]);self.assertFalse(next(note for note in self.session()['data']['notifications'] if note['title']=='Bron tasdiqlandi')['read'])
        self.client.force_login(self.owner);reply=self.session();summary=next(item for item in reply['data']['managerSummary'] if item['userId']=='team-manager-0');self.assertEqual(summary['bookingApprovals'],1)
        self.assertEqual(AuditEntry.objects.filter(details__event='booking_confirmed').count(),1)
        self.assertEqual(self.change('users','team-manager-0',None).status_code,200)
        saved=AuditEntry.objects.get(details__event='booking_confirmed');self.assertIsNone(saved.actor_id);self.assertEqual(saved.details['actorName'],'Manager 0')
        self.assertTrue(any(item['actorName']=='Manager 0' for item in self.session()['data']['auditLog']))
    def test_revision_endpoint_is_lightweight_and_no_store(self):
        result=self.client.get('/hotel-api/revision/');self.assertEqual(result.status_code,200);self.assertEqual(list(result.json()),['revision']);self.assertIn('no-store',result['Cache-Control'])

    def test_site_editor_transfer_revoke_and_owner_access(self):
        for i in range(3): self.assertEqual(self.create_manager(i)[0].status_code,200)
        managers=list(manager_accounts().order_by('pk'))
        def account_for(manager):
            return next(item for item in self.session()['data']['users'] if item['email']==manager.email)
        self.client.force_login(managers[0])
        self.assertEqual(self.change('settings','settings',{'hotelName':'Denied'}).status_code,403)
        self.client.force_login(self.owner)
        first=account_for(managers[0]);first['canEditSite']=True
        self.assertEqual(self.change('users',first['id'],first).status_code,200)
        self.client.force_login(managers[0])
        self.assertEqual(self.change('settings','settings',{'hotelName':'First editor'}).status_code,200)
        self.client.force_login(self.owner)
        second=account_for(managers[1]);second['canEditSite']=True
        self.assertEqual(self.change('users',second['id'],second).status_code,200)
        accounts=self.session()['data']['users']
        self.assertEqual(sum(item['canEditSite'] for item in accounts if item['role']=='manager'),1)
        self.client.force_login(managers[0])
        self.assertEqual(self.change('settings','settings',{'hotelName':'Old editor'}).status_code,403)
        self.client.force_login(managers[1])
        self.assertEqual(self.change('settings','settings',{'hotelName':'Second editor'}).status_code,200)
        self.client.force_login(self.owner)
        second=account_for(managers[1]);second['canEditSite']=False
        self.assertEqual(self.change('users',second['id'],second).status_code,200)
        self.assertEqual(self.change('settings','settings',{'hotelName':'Owner always allowed'}).status_code,200)
        self.client.force_login(managers[1])
        self.assertEqual(self.change('settings','settings',{'hotelName':'Revoked'}).status_code,403)

    def test_managers_cannot_grant_themselves_site_access(self):
        self.assertEqual(self.create_manager(0)[0].status_code,200)
        manager=manager_accounts().get()
        self.client.force_login(manager)
        own=next(item for item in self.session()['data']['users'] if item['email']==manager.email)
        own['canEditSite']=True
        self.assertEqual(self.change('users',own['id'],own).status_code,403)
        self.assertFalse(self.session()['user']['canEditSite'])

    def test_deleting_editor_removes_grant(self):
        self.assertEqual(self.create_manager(0)[0].status_code,200)
        manager=manager_accounts().get()
        own=next(item for item in self.session()['data']['users'] if item['email']==manager.email)
        own['canEditSite']=True
        self.assertEqual(self.change('users',own['id'],own).status_code,200)
        self.assertEqual(self.change('users',own['id'],None).status_code,200)
        from .models import SiteState
        self.assertNotIn('siteEditorUserId',SiteState.objects.get(pk=1).payload)


class ConcurrentManagerLimitTests(TransactionTestCase):
    def test_two_simultaneous_creates_cannot_exceed_three(self):
        User=get_user_model();owner=User.objects.create_superuser('race-owner',email='race-owner@example.test',password='Race-owner-test-8363!')
        group=configure_manager()
        for i in range(2):
            user=User.objects.create_user(f'race-manager-{i}');user.groups.add(group)
        clients=[Client(),Client()]
        for client in clients:client.force_login(owner)
        revision=clients[0].get('/hotel-api/session/').json()['revision'];gate=Barrier(2)
        def create(index):
            close_old_connections()
            try:
                value={'id':f'race-candidate-{index}','name':f'Candidate {index}','email':f'race-candidate-{index}@example.test','password':'Race-candidate-pass-8363!','role':'manager','isActive':True}
                gate.wait(timeout=5)
                response=clients[index].patch('/hotel-api/state/',data=json.dumps({'revision':revision,'changes':[{'collection':'users','id':value['id'],'after':value}]}),content_type='application/json')
                return response.status_code
            finally:connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as pool:statuses=list(pool.map(create,[0,1]))
        self.assertTrue(all(status in [200,400,409] for status in statuses),statuses)
        self.assertLessEqual(manager_accounts().count(),3)
        self.assertLessEqual(statuses.count(200),1)

    def test_two_simultaneous_approvals_produce_one_confirmation(self):
        User=get_user_model();group=configure_manager();managers=[]
        for i in range(2):
            user=User.objects.create_user(f'approval-manager-{i}',first_name=f'Manager {i}');user.groups.add(group);managers.append(user)
        room=Room.objects.create(number='APPROVAL-RACE',room_type='Standard',price=100,capacity=2)
        guest=Guest.objects.create(first_name='Synthetic',last_name='Approval')
        today=timezone.localdate();booking=Booking.objects.create(guest=guest,room=room,check_in=today,check_out=today+timedelta(days=1),status='pending',total_amount=100)
        clients=[Client(),Client()]
        for client,user in zip(clients,managers):client.force_login(user)
        revision=clients[0].get('/hotel-api/session/').json()['revision'];gate=Barrier(2)
        after={'id':f'booking-{booking.pk}','roomId':f'room-{room.pk}','guestId':f'guest-{guest.pk}','checkIn':str(today),'checkOut':str(today+timedelta(days=1)),'adults':1,'children':0,'totalAmount':100,'status':'confirmed','expectedStatus':'pending'}
        def approve(index):
            close_old_connections()
            try:
                gate.wait(timeout=5)
                return clients[index].patch('/hotel-api/state/',data=json.dumps({'revision':revision,'changes':[{'collection':'bookings','id':after['id'],'after':after}]}),content_type='application/json').status_code
            finally:connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as pool:statuses=list(pool.map(approve,[0,1]))
        self.assertEqual(statuses.count(200),1,statuses)
        self.assertTrue(all(status in [200,400,409] for status in statuses),statuses)
        booking.refresh_from_db();self.assertEqual(booking.status,'confirmed')
        self.assertEqual(AuditEntry.objects.filter(details__event='booking_confirmed').count(),1)

from django.db import connection
from django.db.migrations.executor import MigrationExecutor

class AuditIdentityMigrationTests(TransactionTestCase):
    def test_existing_manager_audit_identity_is_preserved_on_upgrade(self):
        old_target=[('hotel','0004_reportsnapshot')]
        latest=[('hotel','0005_auditentry_details')]
        executor=MigrationExecutor(connection);executor.migrate(old_target)
        try:
            apps=executor.loader.project_state(old_target).apps
            User=apps.get_model('auth','User');Group=apps.get_model('auth','Group');Audit=apps.get_model('hotel','AuditEntry')
            group,_=Group.objects.get_or_create(name='Manager')
            user=User.objects.create(username='migration-manager',email='migration@example.test',first_name='Old',last_name='Manager');user.groups.add(group)
            record=Audit.objects.create(actor=user,action='save',entity='booking',entity_id='1')
            executor=MigrationExecutor(connection);executor.migrate(latest)
            Audit=executor.loader.project_state(latest).apps.get_model('hotel','AuditEntry')
            details=Audit.objects.get(pk=record.pk).details
            self.assertEqual(details['actorName'],'Old Manager');self.assertEqual(details['actorEmail'],'migration@example.test');self.assertEqual(details['actorRole'],'manager')
        finally:MigrationExecutor(connection).migrate(latest)
