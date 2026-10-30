from django.contrib.auth.models import Group, Permission

MANAGER_MODELS = ['room', 'guest', 'booking', 'financeentry']

def configure_manager():
    group, _ = Group.objects.get_or_create(name='Manager')
    group.permissions.set(Permission.objects.filter(content_type__app_label='hotel', content_type__model__in=MANAGER_MODELS).exclude(codename='delete_financeentry'))
    return group

def is_manager(user):
    return user.is_authenticated and user.groups.filter(name='Manager').exists()
