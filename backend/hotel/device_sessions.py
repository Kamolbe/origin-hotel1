from datetime import timedelta
from django.contrib.sessions.models import Session
from django.db import OperationalError, IntegrityError
from django.utils import timezone
from django.utils.crypto import constant_time_compare
from .models import ManagerDeviceSession
from .permissions import is_manager, manager_accounts

def track_manager_session(request):
    if not request.user.is_authenticated or request.user.is_superuser or not is_manager(request.user): return
    key=request.session.session_key
    if not key or not Session.objects.filter(pk=key,expire_date__gt=timezone.now()).exists(): return
    item,created=ManagerDeviceSession.objects.get_or_create(session_id=key,defaults={'user':request.user,'user_agent':request.META.get('HTTP_USER_AGENT','')[:512]})
    if not created and item.last_seen_at < timezone.now()-timedelta(seconds=30):
        ManagerDeviceSession.objects.filter(pk=item.pk).update(last_seen_at=timezone.now(),user_agent=request.META.get('HTTP_USER_AGENT','')[:512])

class ManagerSessionMiddleware:
    def __init__(self,get_response): self.get_response=get_response
    def __call__(self,request):
        try: track_manager_session(request)
        except (OperationalError,IntegrityError): pass  # Telemetry must not block hotel operations during concurrent writes.
        return self.get_response(request)

def valid_session(session,user):
    info=session.get_decoded()
    return str(info.get('_auth_user_id',''))==str(user.pk) and constant_time_compare(info.get('_auth_user_hash',''),user.get_session_auth_hash())

def import_existing_sessions():
    """Include pre-deployment sessions; never import invalid password hashes."""
    managers={str(user.pk):user for user in manager_accounts().filter(is_active=True)}
    for session in Session.objects.filter(expire_date__gt=timezone.now()).exclude(pk__in=ManagerDeviceSession.objects.values('session_id')).iterator():
        info=session.get_decoded();user=managers.get(str(info.get('_auth_user_id','')))
        if user and constant_time_compare(info.get('_auth_user_hash',''),user.get_session_auth_hash()):
            ManagerDeviceSession.objects.get_or_create(session=session,defaults={'user':user})

def device_label(agent):
    if not agent: return 'Avvalgi brauzer sessiyasi'
    system='Android' if 'Android' in agent else 'iPhone / iPad' if any(x in agent for x in ('iPhone','iPad')) else 'Windows' if 'Windows' in agent else 'macOS' if 'Macintosh' in agent else 'Linux' if 'Linux' in agent else 'Qurilma'
    browser='Edge' if 'Edg/' in agent else 'Opera' if 'OPR/' in agent else 'Chrome' if 'Chrome/' in agent or 'CriOS/' in agent else 'Firefox' if 'Firefox/' in agent or 'FxiOS/' in agent else 'Safari' if 'Safari/' in agent else 'Brauzer'
    return f'{system} · {browser}'
