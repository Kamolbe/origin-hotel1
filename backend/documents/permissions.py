"""Yopiq hujjatlar uchun ruxsat qoidalari.

Qoida sodda: hujjatni faqat (1) admin, (2) uni yuklagan foydalanuvchi,
(3) hujjat bog'langan mehmonning o'zi va (4) xodimlar (mehmon/bronni ko'rish
huquqi bor manager va employee) ko'radi. Boshqa hech kim ko'rmaydi.
"""


def is_staff(user):
    """Mehmonlar va bronlarni ko'rish huquqiga ega xodim."""
    return bool(
        user.is_authenticated
        and (user.is_superuser or user.has_perm('hotel.view_guest') or user.has_perm('hotel.view_booking'))
    )


def owns_email(user, email):
    """Foydalanuvchi shu email egasimi (mehmon o'z hujjatini ko'rishi uchun)."""
    return bool(user.is_authenticated and email and (user.email or '').lower() == email.lower())


def can_view(user, document):
    if not user.is_authenticated or not user.is_active:
        return False
    if user.is_superuser:
        return True
    if document.uploaded_by_id == user.pk:
        return True
    if document.guest_id and owns_email(user, document.guest.email):
        return True
    return is_staff(user)


def can_delete(user, document):
    """Hujjatni faqat admin yoki uni yuklagan foydalanuvchi o'chiradi."""
    if not user.is_authenticated or not user.is_active:
        return False
    return bool(user.is_superuser or document.uploaded_by_id == user.pk)


def can_attach(user, guest=None, booking=None):
    """Hujjatni shu mehmon/bronga bog'lashga ruxsat bormi."""
    if not user.is_authenticated or not user.is_active:
        return False
    if user.is_superuser or is_staff(user):
        return True
    if booking is not None and not owns_email(user, booking.guest.email):
        return False
    if guest is not None and not owns_email(user, guest.email):
        return False
    return True
