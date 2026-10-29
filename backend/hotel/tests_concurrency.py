from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier
from time import sleep
from django.core.exceptions import ValidationError
from django.db import OperationalError, close_old_connections, transaction
from django.test import TransactionTestCase
from django.utils import timezone
from .models import Booking, Guest, Room

class ConcurrentBookingTests(TransactionTestCase):
    def test_two_simultaneous_requests_cannot_reserve_same_room(self):
        room = Room.objects.create(number='CONCURRENT', room_type='Standard', price=100, capacity=2)
        guest = Guest.objects.create(first_name='Synthetic', last_name='Concurrent')
        gate = Barrier(2)
        def reserve():
            close_old_connections()
            try:
                gate.wait(timeout=5)
                with transaction.atomic():
                    booking = Booking(room_id=room.pk, guest_id=guest.pk, check_in=timezone.localdate(), check_out=timezone.localdate()+timedelta(days=1), total_amount=100)
                    booking.full_clean()
                    booking.save()
                    sleep(.05)
                return 'created'
            except (ValidationError, OperationalError):
                # File SQLite waits then rejects the overlap. Shared-memory test SQLite may
                # reject the competing write immediately; neither path creates a duplicate.
                return 'blocked'
            finally: close_old_connections()
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: reserve(), range(2)))
        self.assertCountEqual(results, ['created', 'blocked'])
        self.assertEqual(Booking.objects.filter(room=room).count(), 1)
