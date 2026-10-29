from datetime import timedelta
from decimal import Decimal
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone
from .models import AuditEntry, Booking, FinanceEntry, Room, SiteState


def lock_hotel_state():
    state, _ = SiteState.objects.select_for_update().get_or_create(pk=1)
    return state


def audit(user, action, obj):
    AuditEntry.objects.create(actor=user, action=action, entity=obj._meta.model_name, entity_id=str(obj.pk))


@transaction.atomic
def transition_booking(user, pk, action):
    if not user.has_perm('hotel.change_booking'): raise PermissionDenied
    lock_hotel_state()
    booking = Booking.objects.select_for_update().select_related('room', 'guest').get(pk=pk)
    room = Room.objects.select_for_update().get(pk=booking.room_id)
    now, today = timezone.now(), timezone.localdate()
    if action == 'check_in':
        if booking.status != 'confirmed' or booking.checked_in_at or not booking.check_in <= today < booking.check_out:
            raise ValidationError('Check-in faqat tasdiqlangan bron sanalarida, bir marta bajariladi.')
        if room.status != 'available' or Booking.objects.filter(room=room, checked_in_at__isnull=False, checked_out_at__isnull=True, status='confirmed').exclude(pk=pk).exists():
            raise ValidationError('Xona hozir joylashtirishga tayyor emas.')
        booking.checked_in_at = now
        room.status = 'occupied'
    elif action == 'check_out':
        if booking.status != 'confirmed' or not booking.checked_in_at or booking.checked_out_at: raise ValidationError('Avval Check-in bajarilishi kerak.')
        booking.checked_out_at = now
        booking.status = 'completed'
        room.status = 'cleaning'
    elif action in ['confirm', 'reject', 'cancel']:
        if not user.has_perm('hotel.delete_booking'): raise PermissionDenied
        if booking.checked_in_at or booking.status not in ['pending', 'confirmed']: raise ValidationError('Bu bron holatini almashtirib bo‘lmaydi.')
        booking.status = {'confirm': 'confirmed', 'reject': 'rejected', 'cancel': 'cancelled'}[action]
        if booking.status == 'confirmed' and room.status in ['cleaning', 'maintenance']: raise ValidationError('Xona tayyor emas.')
    else: raise ValidationError('Noma’lum amal.')
    booking.full_clean()
    booking.save()
    room.save(update_fields=['status'])
    audit(user, action, booking)
    return booking


def period_report(start, end):
    entries = FinanceEntry.objects.filter(date__gte=start, date__lte=end)
    income = sum((entry.amount for entry in entries if entry.entry_type == 'income'), Decimal('0'))
    expense = sum((entry.amount for entry in entries if entry.entry_type == 'expense'), Decimal('0'))
    room_days = set()
    bookings = Booking.objects.filter(check_in__lte=end, check_out__gt=start, status__in=['confirmed', 'completed'])
    for booking in bookings:
        last = min(end + timedelta(days=1), booking.check_out)
        if booking.checked_out_at: last = min(last, timezone.localdate(booking.checked_out_at))
        day = max(start, booking.check_in)
        while day < last:
            room_days.add((booking.room_id, day))
            day += timedelta(days=1)
    days = (end - start).days + 1
    room_count = Room.objects.count()
    return {'income': income, 'expense': expense, 'net': income - expense, 'room_nights': len(room_days), 'occupancy': round(len(room_days) / (room_count * days) * 100, 1) if room_count and days > 0 else 0, 'days': days, 'entries': entries, 'bookings': bookings}
