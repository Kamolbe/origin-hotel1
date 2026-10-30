from django.contrib.auth import get_user_model
from django.db.models import F
from django.db.models.signals import post_delete, post_save
from .models import SiteState, Room, Guest, Booking, FinanceEntry, StaffMember, SalaryPayment, ReportSnapshot

def changed(sender, **kwargs):
    if sender is get_user_model() and kwargs.get("update_fields") == frozenset(["last_login"]): return
    # One revision per API transaction is finalized by react_api.patch; template/admin
    # writes also invalidate older React snapshots instead of being silently overwritten.
    SiteState.objects.filter(pk=1).update(revision=F('revision') + 1)

for model in [Room, Guest, Booking, FinanceEntry, StaffMember, SalaryPayment, ReportSnapshot, get_user_model()]:
    post_save.connect(changed, sender=model, dispatch_uid=f'hotel-save-{model._meta.label}')
    post_delete.connect(changed, sender=model, dispatch_uid=f'hotel-delete-{model._meta.label}')

from django.db.models.signals import post_migrate

def upgrade_manager_permissions(sender, **kwargs):
    if sender.name == 'hotel':
        from .permissions import configure_manager
        configure_manager()
post_migrate.connect(upgrade_manager_permissions, dispatch_uid='hotel-manager-permissions')


from django.db.models.signals import m2m_changed
from django.db import transaction

def enforce_manager_limit(sender, instance, action, reverse, pk_set, **kwargs):
    if action != 'pre_add' or not pk_set: return
    from django.contrib.auth.models import Group
    from .permissions import ensure_manager_capacity, manager_accounts, MAX_MANAGERS
    from .services import lock_hotel_state
    from django.core.exceptions import ValidationError
    with transaction.atomic():
        lock_hotel_state()
        if reverse:
            if instance.name != 'Manager': return
            additional=get_user_model().objects.filter(pk__in=pk_set,is_superuser=False).exclude(pk__in=manager_accounts().values('pk')).count()
            if manager_accounts().count()+additional>MAX_MANAGERS: raise ValidationError('Ko‘pi bilan 3 ta manager hisobi mumkin.')
        elif not instance.is_superuser and Group.objects.filter(pk__in=pk_set,name='Manager').exists():
            ensure_manager_capacity(instance)

m2m_changed.connect(enforce_manager_limit,sender=get_user_model().groups.through,dispatch_uid='hotel-manager-limit')
