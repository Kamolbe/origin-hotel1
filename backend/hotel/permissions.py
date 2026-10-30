from django.contrib.auth.models import Group, Permission

MANAGER_MODELS = ['room', 'guest', 'booking', 'financeentry']

def configure_manager():
    group, _ = Group.objects.get_or_create(name='Manager')
    group.permissions.set(Permission.objects.filter(content_type__app_label='hotel', content_type__model__in=MANAGER_MODELS).exclude(codename='delete_financeentry'))
    return group

def is_manager(user):
    return user.is_authenticated and user.groups.filter(name='Manager').exists()

MAX_MANAGERS = 3

def manager_accounts():
    from django.contrib.auth import get_user_model
    return get_user_model().objects.filter(groups__name='Manager',is_superuser=False).distinct()

def ensure_manager_capacity(user=None):
    from django.core.exceptions import ValidationError
    existing=manager_accounts()
    if user and user.pk: existing=existing.exclude(pk=user.pk)
    if existing.count() >= MAX_MANAGERS:
        raise ValidationError('Ko‘pi bilan 3 ta manager hisobi mumkin. Yangi managerdan oldin mavjud hisobni o‘chiring. Bloklangan hisob ham limitga kiradi.')
