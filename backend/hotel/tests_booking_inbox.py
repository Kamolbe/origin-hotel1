import json
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from .models import Room, Guest, SiteState
from .permissions import configure_manager

class BookingInboxTests(TestCase):
    def setUp(self):
        User=get_user_model()
        self.owner=User.objects.create_superuser('inbox-owner',email='inbox-owner@example.test',password='Test-owner-password-8363')
        self.manager=User.objects.create_user('inbox-manager',email='inbox-manager@example.test');self.manager.groups.add(configure_manager())
        self.user=User.objects.create_user('inbox-guest',email='inbox-guest@example.test')
        self.guest=Guest.objects.create(first_name='Test',last_name='Guest',email=self.user.email)
        self.room=Room.objects.create(number='I101',room_type='Standard',price=100000,capacity=2)
    def session(self):return self.client.get('/hotel-api/session/').json()
    def change(self,kind,key,after):
        return self.client.patch('/hotel-api/state/',data=json.dumps({'revision':self.session()['revision'],'changes':[{'collection':kind,'id':key,'after':after}]}),content_type='application/json')
    def test_guest_booking_and_cancellation_alert_manager_and_not_owner(self):
        self.client.force_login(self.user);today=timezone.localdate()
        booking={'id':'booking-inbox','roomId':f'room-{self.room.pk}','guestId':f'guest-{self.guest.pk}','checkIn':str(today),'checkOut':str(today+timedelta(days=1)),'status':'pending','adults':1,'children':0,'totalAmount':1,'guestNote':'Late arrival'}
        self.assertEqual(self.change('bookings',booking['id'],booking).status_code,200)
        self.client.force_login(self.manager);notes=self.session()['data']['notifications'];self.assertTrue(any(note['title']=='Yangi bron' for note in notes))
        shared=notes[0]
        self.client.force_login(self.owner);self.assertFalse(any(note['type']=='booking' for note in self.session()['data']['notifications']))
        self.change('notifications',shared['id'],{**shared,'read':True})
        self.assertFalse(next(note for note in SiteState.objects.get(pk=1).payload['notifications'] if note['id']==shared['id'])['read'])
        self.client.force_login(self.user);after=self.session()['data']['bookings'][0];after['status']='cancelled'
        self.assertEqual(self.change('bookings',after['id'],after).status_code,200)
        self.assertTrue(any(note['userId']==f'user-{self.user.pk}' for note in self.session()['data']['notifications']))
        self.client.force_login(self.manager);self.assertTrue(any(note['title']=='Bron holati o‘zgardi' for note in self.session()['data']['notifications']))
        self.client.force_login(self.owner);self.assertFalse(any(note['type']=='booking' for note in self.session()['data']['notifications']))
