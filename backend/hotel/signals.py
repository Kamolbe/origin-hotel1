from django.contrib.auth import get_user_model
from django.db.models import F
from django.db.models.signals import post_delete, post_save
from .models import SiteState, Room, Guest, Booking, FinanceEntry, StaffMember, SalaryPayment

def changed(sender, **kwargs):
    if sender is get_user_model() and kwargs.get("update_fields") == frozenset(["last_login"]): return
    # One revision per API transaction is finalized by react_api.patch; template/admin
    # writes also invalidate older React snapshots instead of being silently overwritten.
    SiteState.objects.filter(pk=1).update(revision=F('revision') + 1)

for model in [Room, Guest, Booking, FinanceEntry, StaffMember, SalaryPayment, get_user_model()]:
    post_save.connect(changed, sender=model, dispatch_uid=f'hotel-save-{model._meta.label}')
    post_delete.connect(changed, sender=model, dispatch_uid=f'hotel-delete-{model._meta.label}')

from django.db.models.signals import post_migrate

def upgrade_manager_permissions(sender, **kwargs):
    if sender.name == 'hotel':
        from .permissions import configure_manager
        configure_manager()
post_migrate.connect(upgrade_manager_permissions, dispatch_uid='hotel-manager-permissions')
