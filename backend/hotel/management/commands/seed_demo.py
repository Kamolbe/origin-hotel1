import os
from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from hotel.services import lock_hotel_state
from hotel.models import Room, Guest, Booking, FinanceEntry

class Command(BaseCommand):
    help = 'Faqat sun’iy demo ma’lumotlarini qo‘shadi; mavjud ma’lumot va parollarni almashtirmaydi.'
    @transaction.atomic
    def handle(self, *args, **options):
        lock_hotel_state()
        password = os.environ.get('HOTEL_DEMO_PASSWORD', '')
        if len(password) < 12: raise CommandError('HOTEL_DEMO_PASSWORD: kamida 12 belgili lokal test parolini environment orqali kiriting.')
        employee, _ = Group.objects.get_or_create(name='Employee')
        manager, _ = Group.objects.get_or_create(name='Manager')
        employee.permissions.set(Permission.objects.filter(content_type__app_label='hotel', codename__in=['view_room', 'view_guest', 'add_guest', 'change_guest', 'view_booking', 'add_booking', 'change_booking']))
        manager.permissions.set(Permission.objects.filter(content_type__app_label='hotel').exclude(content_type__model='auditentry').exclude(codename__in=['add_room', 'change_room', 'delete_room', 'delete_booking', 'delete_guest']))
        User = get_user_model()
        for username, role in [('admin@admin.com', 'admin'), ('manager@manager.com', 'manager'), ('employee@origin.test', 'employee')]:
            user, created = User.objects.get_or_create(username=username, defaults={'email': username, 'is_staff': role == 'admin', 'is_superuser': role == 'admin', 'first_name': 'Demo', 'last_name': role.title()})
            if created: user.set_password(password); user.save()
            if role != 'admin': user.groups.add(manager if role == 'manager' else employee)
        for i in range(1, 13):
            Room.objects.get_or_create(number=str(100 + i), defaults={'room_type': 'Deluxe' if i % 3 == 0 else 'Standard', 'price': Decimal('480000'), 'capacity': 2, 'floor': 1 + (i - 1) // 4})
        for i in range(1, 33): Guest.objects.get_or_create(email=f'guest{i}@example.test', defaults={'first_name': 'Test', 'last_name': f'Mehmon {i:02}', 'phone': '', 'nationality': 'Demo', 'passport_number': f'TEST-{i:05}', 'notes': 'Faqat sun’iy demo mehmoni.'})
        today = timezone.localdate()
        guest = Guest.objects.get(email='guest1@example.test')
        room = Room.objects.get(number='101')
        if not Booking.objects.filter(notes='Seed demo bron').exists() and not Booking.objects.filter(room=room, status__in=['pending', 'confirmed'], check_in__lt=today + timedelta(days=2), check_out__gt=today).exists():
            booking = Booking(guest=guest, room=room, check_in=today, check_out=today + timedelta(days=2), total_amount=room.price * 2, notes='Seed demo bron')
            booking.full_clean(); booking.save()
        FinanceEntry.objects.get_or_create(description='Seed demo xona haqi', defaults={'entry_type': 'income', 'category': 'room_revenue', 'amount': Decimal('480000'), 'date': today})
        FinanceEntry.objects.get_or_create(description='Seed demo material xaridi', defaults={'entry_type': 'expense', 'category': 'supplies', 'amount': Decimal('80000'), 'date': today})
        self.stdout.write(self.style.SUCCESS('Demo tayyor: 12 xona, 32 sun’iy mehmon, 3 rol. Mavjud yozuv/parollar saqlandi.'))
