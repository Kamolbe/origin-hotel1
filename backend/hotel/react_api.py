import json
from uuid import uuid4
from decimal import Decimal, InvalidOperation
from functools import wraps
from pathlib import Path
from urllib.parse import urlparse
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError, OperationalError, DatabaseError, connection, transaction
from django.http import FileResponse, HttpResponse, HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import SiteState, Room, Guest, Booking, FinanceEntry, AuditEntry, StaffMember, SalaryPayment, ReportSnapshot
from .permissions import configure_manager, is_manager, ensure_manager_capacity, manager_accounts
from .services import transition_booking, audit, lock_hotel_state

MODELS = {'rooms': Room, 'guests': Guest, 'bookings': Booking, 'finance': FinanceEntry, 'employees': StaffMember, 'salaryPayments': SalaryPayment, 'reports': ReportSnapshot}
PUBLIC_SETTINGS = ['website','hotelName','contact','currency','timeZone','dateFormat','checkInTime','checkOutTime','taxRate','serviceFeeRate','seo','interface']

def role(user):
    return 'admin' if user.is_superuser else 'manager' if user.has_perm('hotel.view_room') else 'user'

def staff(user): return user.is_authenticated and role(user) in ['admin','manager']

def key_for(state, kind, pk):
    ids = state.payload.get('ids', {}).get(kind, {})
    return next((key for key, value in ids.items() if value == pk), f'{kind.rstrip("s")}-{pk}')

def find_record(state, kind, key):
    model = get_user_model() if kind == 'users' else MODELS[kind]
    pk = state.payload.get('ids', {}).get(kind, {}).get(key)
    if pk is None:
        prefix = f'{kind.rstrip("s")}-'
        if not key.startswith(prefix) or not key[len(prefix):].isdigit(): return None
        pk = int(key[len(prefix):])
    return model.objects.filter(pk=pk).first()

def extras(state, kind, key): return state.payload.get('extras', {}).get(kind, {}).get(key, {})

def iso(value): return value.isoformat() if value else None

def can_edit_site(state, user):
    return user.is_authenticated and user.is_active and (user.is_superuser or is_manager(user) and state.payload.get('siteEditorUserId') == user.pk)

def account(state, user):
    key = key_for(state, 'users', user.pk)
    extra = {name:value for name,value in extras(state,'users',key).items() if name not in ['password','accessCode']}
    return {**extra, 'id': key, 'name': user.get_full_name() or user.username, 'email': user.email or user.username, 'role': role(user), 'isManagerAccount':is_manager(user) and not user.is_superuser, 'canEditSite':can_edit_site(state,user), 'password': '', 'isActive': user.is_active, 'profileRequired': bool(extra.get('profileRequired',False)), 'createdAt': iso(user.date_joined), 'lastLoginAt': iso(user.last_login)}

def notification_visible(state,user,note):
    if not user.is_authenticated or role(user)=='admin' and note.get('type')=='booking': return False
    if note.get('userId'): return note['userId']==key_for(state,'users',user.pk)
    if note.get('type')=='booking': return role(user)=='manager'
    return staff(user)

def snapshot(state, user):
    rooms, guests, bookings, finance = [], [], [], []
    for room in Room.objects.all():
        key = key_for(state,'rooms',room.pk)
        rooms.append({**extras(state,'rooms',key), 'id':key,'number':room.number,'type':room.room_type,'floor':room.floor,'capacity':room.capacity,'status':room.status,'pricePerNight':float(room.price),'amenities':extras(state,'rooms',key).get('amenities',[])})
    all_bookings = Booking.objects.select_related('guest','room').all()
    own_ids = set()
    for booking in all_bookings:
        key = key_for(state,'bookings',booking.pk)
        extra = extras(state,'bookings',key)
        owner = extra.get('userId')
        mine = user.is_authenticated and (owner == key_for(state,'users',user.pk) if owner else booking.guest.email.lower() == user.email.lower())
        if not staff(user) and not mine: continue
        own_ids.add(booking.guest_id)
        bookings.append({**extra,'id':key,'bookingNumber':extra.get('bookingNumber',f'BR-{booking.pk:05}'),'guestId':key_for(state,'guests',booking.guest_id),'roomId':key_for(state,'rooms',booking.room_id),'checkIn':str(booking.check_in),'checkOut':str(booking.check_out),'status':booking.status,'adults':booking.adults,'children':booking.children,'totalAmount':float(booking.total_amount),'paidAmount':extra.get('paidAmount',0),'source':extra.get('source','walk_in'),'createdAt':iso(booking.created_at),'notes':booking.notes,'guestNote':booking.notes if owner else extra.get('guestNote'),'checkedInAt':iso(booking.checked_in_at),'checkedOutAt':iso(booking.checked_out_at)})
    for guest in Guest.objects.all():
        if not staff(user) and not (user.is_authenticated and (guest.pk in own_ids or guest.email.lower() == user.email.lower())): continue
        key = key_for(state,'guests',guest.pk)
        guests.append({'id':key,'archived':guest.archived,'firstName':guest.first_name,'lastName':guest.last_name,'email':guest.email,'phone':guest.phone,'nationality':guest.nationality,'passportNumber':guest.passport_number,'notes':guest.notes,'createdAt':iso(guest.created_at)})
    if user.is_authenticated and user.has_perm('hotel.view_financeentry'):
        payroll_ids=set(SalaryPayment.objects.values_list('finance_id',flat=True))
        for entry in FinanceEntry.objects.all():
            key = key_for(state,'finance',entry.pk)
            finance.append({**extras(state,'finance',key),'id':key,'isPayroll':entry.pk in payroll_ids,'type':entry.entry_type,'category':entry.category,'amount':float(entry.amount),'date':str(entry.date),'description':entry.description,'paymentMethod':extras(state,'finance',key).get('paymentMethod','cash'),'bookingId':key_for(state,'bookings',entry.booking_id) if entry.booking_id else None})
    users = [account(state,item) for item in (get_user_model().objects.all() if user.is_authenticated and (role(user)=='admin' or is_manager(user)) else [user] if user.is_authenticated else [])]
    config = state.payload.get('settings',{})
    if not user.is_authenticated or role(user) not in ['admin','manager']: config = {key:value for key,value in config.items() if key in PUBLIC_SETTINGS}
    notifications = [{**note, **({'read':key_for(state,'users',user.pk) in note.get('readBy',[])} if note.get('type')=='booking' and not note.get('userId') else {})} for note in state.payload.get('notifications',[]) if notification_visible(state,user,note)]
    if user.is_authenticated and role(user)=='admin':
        from .payroll import due_notifications
        notifications=due_notifications(key_for(state,'users',user.pk),state.payload.get('payrollRead',[]))+notifications
    logs = [{'id':str(item.pk),'action':item.action,'details':item.details,'actorName':item.details.get('actorName') or (item.actor.get_full_name() or item.actor.username if item.actor else 'Tizim'),'actorEmail':item.details.get('actorEmail',''),'entityType':{'financeentry':'finance'}.get(item.entity,item.entity),'entityId':item.entity_id,'userId':key_for(state,'users',item.actor_id or int(item.details['actorId'])) if item.actor_id or str(item.details.get('actorId','')).isdigit() else None,'createdAt':iso(item.created_at)} for item in AuditEntry.objects.select_related('actor').all()[:1000]] if staff(user) else []
    employees = [{'id':key_for(state,'employees',e.pk),'name':e.name,'jobTitle':e.job_title,'phone':e.phone,'email':e.email,'monthlySalary':float(e.monthly_salary),'startDate':str(e.start_date),'payday':e.payday,'notes':e.notes,'isActive':e.is_active,'createdAt':iso(e.created_at)} for e in StaffMember.objects.all()] if user.is_authenticated and role(user)=='admin' else []
    salaries = [{'id':key_for(state,'salaryPayments',p.pk),'employeeId':key_for(state,'employees',p.employee_id),'period':p.period.strftime('%Y-%m'),'amount':float(p.amount),'paidAt':iso(p.paid_at),'paidBy':key_for(state,'users',p.paid_by_id) if p.paid_by_id else None} for p in SalaryPayment.objects.all()] if user.is_authenticated and role(user)=='admin' else []
    reports = [{'id':key_for(state,'reports',record.pk),'title':record.title,'from':str(record.start_date),'to':str(record.end_date),'summary':record.summary,'createdBy':key_for(state,'users',record.created_by_id) if record.created_by_id else None,'createdAt':iso(record.created_at)} for record in ReportSnapshot.objects.all()] if staff(user) and user.has_perm('hotel.view_financeentry') else []
    manager_summary=[]
    if user.is_authenticated and role(user)=='admin':
        from django.db.models import Count, Q, Max
        for row in AuditEntry.objects.filter(actor__in=manager_accounts()).values('actor_id').annotate(total=Count('id'),approvals=Count('id',filter=Q(details__event='booking_confirmed')),last=Max('created_at')):
            manager_summary.append({'userId':key_for(state,'users',row['actor_id']),'totalActions':row['total'],'bookingApprovals':row['approvals'],'lastActionAt':iso(row['last'])})
    return {'managerSummary':manager_summary,'serverPermissions':list(user.get_all_permissions()) if user.is_authenticated else [],'reports':reports,'employees':employees,'salaryPayments':salaries,'rooms':rooms,'guests':guests,'bookings':bookings,'finance':finance,'users':users,'settings':config,'notifications':notifications,'visits':state.payload.get('visits',[]) if user.is_authenticated and role(user) in ['admin','manager'] else [],'auditLog':logs,'unavailableStays':[{'roomId':key_for(state,'rooms',b.room_id),'checkIn':str(b.check_in),'checkOut':str(b.check_out)} for b in all_bookings if b.status in ['pending','confirmed']]}

def response(request,state):
    return JsonResponse({'data':snapshot(state,request.user),'user':account(state,request.user) if request.user.is_authenticated else None,'revision':state.revision,'csrfToken':get_token(request)},headers={'Cache-Control':'no-store, private'})

def endpoint(view):
    @wraps(view)
    def wrapped(request,*args,**kwargs):
        try: return view(request,*args,**kwargs)
        except PermissionDenied: return JsonResponse({'message':'Bu amal uchun server ruxsati yo‘q.'},status=403)
        except (ValidationError,ValueError,TypeError,KeyError,IntegrityError,InvalidOperation) as exc:
            message = '; '.join(exc.messages) if isinstance(exc,ValidationError) else 'Kiritilgan ma’lumotlarni tekshiring.'
            return JsonResponse({'message':message},status=400)
        except OperationalError: return JsonResponse({'message':'Baza band. Qayta urinib ko‘ring.'},status=409)
    return wrapped

def body(request):
    if len(request.body)>4500000: raise ValidationError('Ma’lumot hajmi 4.5 MB dan oshdi.')
    value = json.loads(request.body or '{}')
    if not isinstance(value,dict): raise ValidationError('JSON obyekt kerak.')
    return value

def notification(state,title,message,owner=None):
    notes = state.payload.setdefault('notifications',[])
    recipients=[owner] if owner else [key_for(state,'users',pk) for pk in manager_accounts().filter(is_active=True).values_list('pk',flat=True)]
    # A shared fallback keeps pending requests visible if the first manager is added later.
    for recipient in recipients or [None]:
        notes.insert(0,{'id':f'notification-{uuid4()}','userId':recipient,'type':'booking','title':title,'message':message,'read':False,'createdAt':iso(timezone.now())})
    state.payload['notifications']=notes[:1000]

@ensure_csrf_cookie
@endpoint
def session(request):
    if request.method != 'GET': return JsonResponse({},status=405)
    state,_=SiteState.objects.get_or_create(pk=1)
    return response(request,state)

@endpoint
def auth(request, action):
    if request.method != 'POST': return JsonResponse({},status=405)
    values=body(request)
    if action == 'complete-profile':
        if not request.user.is_authenticated: raise PermissionDenied
        import re
        first=str(values.get('firstName','')).strip();last=str(values.get('lastName','')).strip();phone=re.sub(r'[\s()\-]','',str(values.get('phone','')))
        if not first or not last or len(first)>80 or len(last)>80 or not re.fullmatch(r'\+?[0-9]{9,15}',phone) or values.get('confirmed') is not True: raise ValidationError('Ism, familiya va to‘g‘ri telefonni kiriting, ma’lumotlaringizni tasdiqlang.')
        with transaction.atomic():
            state=lock_hotel_state();request.user.first_name=first;request.user.last_name=last;request.user.full_clean();request.user.save()
            key=key_for(state,'users',request.user.pk)
            extra=state.payload.setdefault('extras',{}).setdefault('users',{}).setdefault(key,{})
            extra.update({'phone':phone,'profileRequired':False,'profileConfirmedAt':iso(timezone.now())})
            Guest.objects.filter(email__iexact=request.user.email).update(first_name=first,last_name=last,phone=phone)
            state.revision+=1;state.save();return response(request,state)
    if action == 'logout': logout(request)
    elif action in ['login','register','google']:
        throttle=f'hotel-login:{request.META.get("REMOTE_ADDR","")}'
        if cache.get(throttle,0)>=20: return JsonResponse({'message':'Ko‘p urinish. Birozdan keyin qayta urinib ko‘ring.'},status=429)
        email=str(values.get('email','')).strip().lower()
        if action == 'google':
            from google.oauth2.id_token import verify_firebase_token
            from google.auth.transport.requests import Request
            try: profile=verify_firebase_token(str(values.get('idToken','')),Request(),audience=settings.FIREBASE_PROJECT_ID)
            except Exception: return JsonResponse({'message':'Google hisobini server tasdiqlay olmadi.'},status=401)
            if profile.get('email_verified') is not True or profile.get('iss') != f'https://securetoken.google.com/{settings.FIREBASE_PROJECT_ID}' or not profile.get('sub'): raise PermissionDenied
            email=str(profile.get('email','')).lower()
            user=get_user_model().objects.filter(email__iexact=email).first()
            if user and (staff(user) or not user.is_active): raise PermissionDenied
            if not user:
                user=get_user_model()(username=email,email=email,first_name=str(profile.get('name','Mehmon'))[:150]);user.set_unusable_password();user.full_clean();user.save()
        elif action == 'register':
            if get_user_model().objects.filter(Q_EMAIL(email)).exists(): return JsonResponse({'message':'Bu email bilan hisob mavjud.','error':'duplicate'},status=400)
            user=get_user_model()(username=email,email=email,first_name=str(values.get('firstName','')).strip(),last_name=str(values.get('lastName','')).strip())
            if not user.first_name or not user.last_name: raise ValidationError('Ism va familiya majburiy.')
            validate_password(values.get('password',''),user);user.set_password(values['password']);user.full_clean();user.save()
        else:
            matched=get_user_model().objects.filter(Q_EMAIL(email)).first()
            user=authenticate(request,username=matched.username if matched else email,password=values.get('password',''))
            if not user:
                cache.set(throttle,cache.get(throttle,0)+1,600)
                return JsonResponse({'message':'Email yoki parol noto‘g‘ri.','error':'credentials'},status=401)
        cache.delete(throttle)
        if values.get('portal') == 'manager' and not is_manager(user): raise PermissionDenied
        if values.get('portal') == 'admin' and not user.is_superuser: raise PermissionDenied
        if action == 'google':
            with transaction.atomic():
                state=lock_hotel_state();key=key_for(state,'users',user.pk)
                extra=state.payload.setdefault('extras',{}).setdefault('users',{}).setdefault(key,{})
                if not extra.get('profileConfirmedAt'): extra['profileRequired']=True
                state.revision+=1;state.save()
        login(request,user,backend='django.contrib.auth.backends.ModelBackend')
        if is_manager(user) and not user.is_superuser:
            request.session.save()
            from .device_sessions import track_manager_session
            track_manager_session(request)
        with transaction.atomic():
            state=lock_hotel_state();audit(user,'Tizimga kirildi',user,{'event':'login'});state.revision+=1;state.save()
    else: return JsonResponse({},status=404)
    state,_=SiteState.objects.get_or_create(pk=1)
    return response(request,state)

def Q_EMAIL(email):
    from django.db.models import Q
    return Q(email__iexact=email)|Q(username__iexact=email)


def check_permission(user,kind,action):
    name=MODELS[kind]._meta.model_name
    if not user.has_perm(f'hotel.{action}_{name}'): raise PermissionDenied

def save_extra(state,kind,key,after,fields):
    destination=state.payload.setdefault('extras',{}).setdefault(kind,{})
    destination[key]={**destination.get(key,{}), **{name:after[name] for name in fields if name in after}}


def mutate(state,user,kind,key,after):
    admin=role(user)=='admin'
    manager=is_manager(user)
    if kind=='settings':
        if not can_edit_site(state,user) or not isinstance(after,dict): raise PermissionDenied
        contact=after.get('contact')
        if isinstance(contact,dict):
            from .map_preview import map_embed_url
            previous=state.payload.get('settings',{}).get('contact',{})
            if contact.get('mapUrl') != previous.get('mapUrl') or contact.get('address') != previous.get('address') or contact.get('city') != previous.get('city') or not previous.get('mapEmbedUrl'):
                contact['mapEmbedUrl']=map_embed_url(str(contact.get('mapUrl','')),f"{contact.get('address','')} {contact.get('city','')}")
            else: contact['mapEmbedUrl']=previous['mapEmbedUrl']
        state.payload['settings']=after
        audit(user,'site settings updated',state)
        return
    if kind=='notifications':
        if admin and key.startswith('payroll-due-') and after:
            valid={note['id'] for note in snapshot(state,user)['notifications']}
            if key not in valid: raise PermissionDenied
            read=set(state.payload.get('payrollRead',[]))
            if after.get('read'): read.add(key)
            else: read.discard(key)
            state.payload['payrollRead']=sorted(read)[-5000:]
            return
        for note in state.payload.get('notifications',[]):
            if note['id']==key and after and notification_visible(state,user,note):
                if note.get('type')=='booking' and not note.get('userId'):
                    readers=set(note.get('readBy',[]));user_key=key_for(state,'users',user.pk)
                    if after.get('read'): readers.add(user_key)
                    else: readers.discard(user_key)
                    note['readBy']=sorted(readers)
                else: note['read']=bool(after.get('read'))
        return
    if kind=='users':
        obj=find_record(state,kind,key)
        if not (admin or manager) and (not obj or obj.pk!=user.pk): raise PermissionDenied
        if after is None:
            if not obj or obj.pk==user.pk or obj.is_superuser or manager and is_manager(obj): raise PermissionDenied
            if state.payload.get('siteEditorUserId')==obj.pk: state.payload.pop('siteEditorUserId',None)
            audit(user,'delete',obj);obj.delete();return
        if 'canEditSite' in after and (not isinstance(after['canEditSite'],bool) or not admin and after['canEditSite'] != bool(obj and can_edit_site(state,obj))): raise PermissionDenied
        if manager and (obj and obj.is_superuser or after and after.get('role')=='admin' or obj and is_manager(obj) and obj.pk!=user.pk or after.get('role')=='manager' and (not obj or not is_manager(obj))): raise PermissionDenied
        if after.get('role')=='manager' and (not obj or not is_manager(obj)): ensure_manager_capacity(obj)
        if obj is None:
            obj=get_user_model()(username=after['email'].strip().lower(),email=after['email'].strip().lower())
            validate_password(after.get('password',''),obj);obj.set_password(after['password'])
        if not (admin or manager) and (after.get('role')!=role(obj) or after.get('email')!=obj.email or after.get('isActive')!=obj.is_active): raise PermissionDenied
        if admin and obj.pk==user.pk and (after.get('role')!='admin' or not after.get('isActive')): raise PermissionDenied
        name=after.get('name','').strip()
        if not name: raise ValidationError('Ism majburiy.')
        obj.first_name=name[:150];obj.last_name=''
        if admin or manager: obj.email=after['email'].strip().lower();obj.username=obj.email;obj.is_active=bool(after.get('isActive',True))
        if obj.pk and after.get('password'): validate_password(after['password'],obj);obj.set_password(after['password'])
        if get_user_model().objects.filter(email__iexact=obj.email).exclude(pk=obj.pk).exists(): raise ValidationError('Bu email bilan hisob mavjud.')
        obj.full_clean();obj.save()
        if admin or manager:
            newrole=after.get('role','user')
            if newrole not in ['admin','manager','user']: raise ValidationError('Rol noto‘g‘ri.')
            obj.is_superuser=newrole=='admin';obj.is_staff=newrole=='admin';obj.save(update_fields=['is_superuser','is_staff'])
            obj.groups.clear()
            if newrole=='manager':
                obj.groups.add(configure_manager())
        state.payload.setdefault('ids',{}).setdefault(kind,{})[key]=obj.pk
        if admin:
            previous_editor=state.payload.get('siteEditorUserId')
            if after.get('canEditSite') is True and is_manager(obj) and not obj.is_superuser:
                state.payload['siteEditorUserId']=obj.pk
            elif previous_editor==obj.pk and (after.get('canEditSite') is False or not is_manager(obj) or obj.is_superuser):
                state.payload.pop('siteEditorUserId',None)
            if previous_editor != state.payload.get('siteEditorUserId'):
                audit(user,'site editor permission changed',obj,details={'previousEditorId':previous_editor,'editorId':state.payload.get('siteEditorUserId')})
        save_extra(state,kind,key,after,['phone','nationality','avatarUrl','preferences','twoFactorEnabled'])
        audit(user,'profile',obj)
        return
    if kind == 'reports':
        if not user.has_perm('hotel.view_financeentry') or not (admin or manager): raise PermissionDenied
        obj=find_record(state,kind,key)
        if after is None:
            if not admin: raise PermissionDenied
            if obj: audit(user,'delete saved report',obj);obj.delete()
            return
        if obj: raise ValidationError('Saqlangan hisobot qayta yozilmaydi. Yangi hisobot yarating.')
        start=parse_date(after.get('from',''));end=parse_date(after.get('to',''))
        title=str(after.get('title','')).strip()
        if not start or not end or end<start or (end-start).days>3660 or not title: raise ValidationError('Hisobot nomi va sanalarini tekshiring. Davr 10 yildan oshmasin.')
        from .services import period_report
        report=period_report(start,end)
        summary={name:float(value) if isinstance(value,Decimal) else value for name,value in report.items() if name not in ['entries','bookings']}
        summary.update({'bookingCount':report['bookings'].count(),'financeCount':report['entries'].count(),'currency':state.payload.get('settings',{}).get('currency','UZS')})
        obj=ReportSnapshot(title=title,start_date=start,end_date=end,summary=summary,created_by=user);obj.full_clean();obj.save()
        state.payload.setdefault('ids',{}).setdefault(kind,{})[key]=obj.pk;audit(user,'save report',obj);return
    if kind == 'employees':
        if not admin: raise PermissionDenied
        obj=find_record(state,kind,key)
        if after is None:
            if obj:
                audit(user,'archive employee',obj)
                if obj.payments.exists(): obj.is_active=False;obj.save(update_fields=['is_active'])
                else: obj.delete()
            return
        if after.get('id')!=key: raise ValidationError('ID noto‘g‘ri.')
        import re
        obj=obj or StaffMember()
        obj.name=after['name'].strip();obj.job_title=after['jobTitle'].strip();obj.phone=re.sub(r'[\s()\-]','',after['phone']);obj.email=after.get('email','').strip();obj.monthly_salary=Decimal(str(after['monthlySalary']));obj.start_date=parse_date(after['startDate']);obj.payday=int(after['payday']);obj.notes=after.get('notes','');obj.is_active=bool(after.get('isActive',True))
        if not obj.name or not obj.job_title or not obj.start_date or obj.start_date.year<1900: raise ValidationError('Ishchi ma’lumotlarini to‘liq kiriting.')
        obj.full_clean();obj.save();state.payload.setdefault('ids',{}).setdefault(kind,{})[key]=obj.pk;audit(user,'save employee',obj);return
    if kind == 'salaryPayments':
        if not admin: raise PermissionDenied
        if after is None or find_record(state,kind,key): raise ValidationError('To‘lov tarixi o‘chirilmaydi yoki qayta yozilmaydi.')
        employee=find_record(state,'employees',after['employeeId']);period=parse_date(after['period']+'-01');today=timezone.localdate()
        if not employee or not employee.is_active or not period or period>today.replace(day=1) or period<employee.start_date.replace(day=1): raise ValidationError('Ishchi yoki hisob oyi noto‘g‘ri.')
        if SalaryPayment.objects.filter(employee=employee,period=period).exists(): raise ValidationError('Ushbu oy uchun oylik avval to‘langan.')
        finance=FinanceEntry(entry_type='expense',category='payroll',amount=employee.monthly_salary,date=today,description=f'{employee.name} · {period:%Y-%m} oyligi')
        finance.full_clean();finance.save()
        obj=SalaryPayment(employee=employee,period=period,amount=employee.monthly_salary,paid_by=user,finance=finance);obj.full_clean();obj.save()
        state.payload.setdefault('ids',{}).setdefault(kind,{})[key]=obj.pk;audit(user,'salary paid',obj);return
    if kind not in MODELS: raise ValidationError('Noma’lum kolleksiya.')
    obj=find_record(state,kind,key)
    if kind=='finance' and after is None and not admin: raise PermissionDenied
    if kind=='finance' and obj and SalaryPayment.objects.filter(finance=obj).exists(): raise ValidationError('Bu ish haqi yozuvi; to‘lov tarixi himoyalangan.')
    if after is None:
        check_permission(user,kind,'delete')
        if obj is None: return
        if kind=='rooms' and obj.booking_set.exists() or kind=='guests' and obj.booking_set.filter(status__in=['pending','confirmed']).exists() or kind=='bookings' and obj.status not in ['completed','cancelled']: raise ValidationError('Faol yoki tarixli yozuvni o‘chirib bo‘lmaydi.')
        audit(user,'delete',obj)
        if kind=='guests': obj.archived=True;obj.save(update_fields=['archived'])
        else: obj.delete()
        return
    if after.get('id')!=key: raise ValidationError('ID noto‘g‘ri.')
    if kind=='rooms':
        check_permission(user,kind,'change' if obj else 'add')
        obj=obj or Room()
        if obj.pk and obj.booking_set.filter(checked_in_at__isnull=False,checked_out_at__isnull=True,status='confirmed').exists() and after['status']!='occupied': raise ValidationError('Avval Check-out bajaring.')
        if not isinstance(after.get('amenities',[]),list) or any(not isinstance(value,str) for value in after.get('amenities',[])): raise ValidationError('Qulayliklar ro‘yxati noto‘g‘ri.')
        obj.number=after['number'].strip();obj.room_type=after['type'];obj.floor=int(after['floor']);obj.capacity=int(after['capacity']);obj.price=Decimal(str(after['pricePerNight']));obj.status=after['status']
        save_extra(state,kind,key,after,['amenities','imageUrl','description'])
    elif kind=='guests':
        mine=(obj.email.lower()==user.email.lower() if obj else after.get('email','').lower()==user.email.lower())
        if not staff(user) and not mine: raise PermissionDenied
        if staff(user): check_permission(user,kind,'change' if obj else 'add')
        obj=obj or Guest()
        if not staff(user) and after.get('email','').lower()!=user.email.lower(): raise PermissionDenied
        obj.first_name=after['firstName'].strip();obj.last_name=after.get('lastName','').strip();obj.email=after.get('email','');obj.phone=after.get('phone','');obj.nationality=after.get('nationality','');obj.passport_number=after.get('passportNumber') or '';obj.notes=after.get('notes') or ''
        # Some Google accounts have one display name; preserve a valid guest record.
        if not obj.last_name: obj.last_name='—'
    elif kind=='bookings':
        previous_status=obj.status if obj else None
        if obj and after.get('expectedStatus') is not None and after['expectedStatus']!=obj.status: raise ValidationError('Bu bronni boshqa manager allaqachon ko‘rib chiqqan. Yangilangan holatni tekshiring.')
        room=find_record(state,'rooms',after['roomId']);guest=find_record(state,'guests',after['guestId'])
        if not room or not guest: raise ValidationError('Xona yoki mehmon topilmadi.')
        own=obj and (extras(state,kind,key).get('userId')==key_for(state,'users',user.pk) or not extras(state,kind,key).get('userId') and obj.guest.email.lower()==user.email.lower())
        if not staff(user):
            if obj:
                if not own or obj.checked_in_at or after['status']!='cancelled': raise PermissionDenied
                frozen={'roomId':key_for(state,'rooms',obj.room_id),'guestId':key_for(state,'guests',obj.guest_id),'checkIn':str(obj.check_in),'checkOut':str(obj.check_out),'totalAmount':float(obj.total_amount),'adults':obj.adults,'children':obj.children}
                if any(after.get(name)!=value for name,value in frozen.items()): raise PermissionDenied
            elif guest.email.lower()!=user.email.lower() or after.get('status')!='pending': raise PermissionDenied
        else: check_permission(user,kind,'change' if obj else 'add')
        if obj and (after.get('checkedInAt') and not obj.checked_in_at or after.get('checkedOutAt') and not obj.checked_out_at):
            frozen={'roomId':key_for(state,'rooms',obj.room_id),'guestId':key_for(state,'guests',obj.guest_id),'checkIn':str(obj.check_in),'checkOut':str(obj.check_out),'totalAmount':float(obj.total_amount),'adults':obj.adults,'children':obj.children}
            if any(after.get(name)!=value for name,value in frozen.items()): raise ValidationError('Check-in/out paytida bron tafsilotlarini almashtirib bo‘lmaydi.')
            transition_booking(user,obj.pk,'check_out' if after.get('checkedOutAt') else 'check_in')
            return
        if obj and obj.checked_in_at: raise ValidationError('Joylashtirilgan bron tahrirlanmaydi. Check-out bajaring.')
        if obj and after['status']!=obj.status and staff(user) and not (admin or manager): raise PermissionDenied
        if obj and after['status']=='confirmed' and obj.status not in ['pending','confirmed']: raise ValidationError('Faqat kutilayotgan bronni tasdiqlash mumkin.')
        new=obj is None;obj=obj or Booking()
        obj.room=room;obj.guest=guest;obj.check_in=parse_date(after['checkIn']);obj.check_out=parse_date(after['checkOut']);obj.status=after['status'];obj.adults=int(after['adults']);obj.children=int(after['children'])
        if not obj.check_in or not obj.check_out: raise ValidationError('Sanalarni to‘g‘ri kiriting.')
        if new and (room.status in ['cleaning','maintenance'] or obj.check_in<timezone.localdate()): raise ValidationError('Xona yoki sana bronlashga tayyor emas.')
        if new and (after.get('checkedInAt') or after.get('checkedOutAt')): raise PermissionDenied
        obj.total_amount=room.price*(obj.check_out-obj.check_in).days if new else Decimal(str(after['totalAmount']))
        obj.notes=after.get('guestNote') if after.get('guestNote') is not None else after.get('notes') or ''
        metadata={**after}
        if not staff(user): metadata['userId']=key_for(state,'users',user.pk);metadata['paidAmount']=0 if new else extras(state,kind,key).get('paidAmount',0)
        save_extra(state,kind,key,metadata,['bookingNumber','userId','source','paidAmount','guestNote'])
        owner_key=extras(state,kind,key).get('userId')
        if new: notification(state,'Yangi bron',f'{guest.first_name} · {room.number}-xona')
        elif owner_key: notification(state,'Bron holati yangilandi',f'{guest.first_name} · {room.number}-xona',owner_key)
        if not new and previous_status!=obj.status:
            actor=user.get_full_name() or user.username
            notification(state,'Bron tasdiqlandi' if obj.status=='confirmed' else 'Bron holati o‘zgardi',f'{guest.first_name} · {room.number}-xona · {obj.get_status_display()} · {actor}')
            metadata=state.payload.setdefault('extras',{}).setdefault(kind,{}).setdefault(key,{})
            metadata.update({'lastHandledBy':key_for(state,'users',user.pk),'lastHandledByName':actor,'handledAt':iso(timezone.now())})
    else:
        check_permission(user,kind,'change' if obj else 'add')
        obj=obj or FinanceEntry();obj.entry_type=after['type'];obj.category=after['category'];obj.amount=Decimal(str(after['amount']));obj.date=parse_date(after['date'][:10]);obj.description=after['description'];obj.booking=find_record(state,'bookings',after['bookingId']) if after.get('bookingId') else None
        save_extra(state,kind,key,after,['paymentMethod'])
    obj.full_clean();obj.save()
    state.payload.setdefault('ids',{}).setdefault(kind,{})[key]=obj.pk
    if kind=='bookings' and previous_status!=obj.status:
        audit(user,'Bron tasdiqlandi' if obj.status=='confirmed' else 'Bron holati yangilandi',obj,{'event':'booking_confirmed' if obj.status=='confirmed' else 'booking_status_changed','previousStatus':previous_status,'status':obj.status,'bookingNumber':extras(state,kind,key).get('bookingNumber',f'BR-{obj.pk:05}'),'roomNumber':obj.room.number})
    else: audit(user,'save',obj)

@endpoint
@transaction.atomic
def patch(request):
    if request.method!='PATCH': return JsonResponse({},status=405)
    if not request.user.is_authenticated: raise PermissionDenied
    values=body(request)
    state=lock_hotel_state()
    if is_manager(request.user):
        from django.contrib.sessions.models import Session
        if not Session.objects.filter(pk=request.session.session_key,expire_date__gt=timezone.now()).exists(): raise PermissionDenied
    if extras(state,'users',key_for(state,'users',request.user.pk)).get('profileRequired'): raise ValidationError('Avval ism, familiya va telefoningizni tasdiqlang.')
    if values.get('revision')!=state.revision: return JsonResponse({'message':'Boshqa qurilmada ma’lumot yangilandi. Server nusxasi qayta yuklanadi.'},status=409)
    changes=values.get('changes',[])
    if not isinstance(changes,list) or len(changes)>2000 or any(not isinstance(item,dict) or item.get('after') is not None and not isinstance(item.get('after'),dict) for item in changes): raise ValidationError('O‘zgarishlar ro‘yxati noto‘g‘ri.')
    # Booking arrivals/departures update the associated room on the server. The matching
    # UI room patch is redundant and must never grant a manager general room-edit rights.
    movement_rooms=set()
    for item in changes:
        if item.get('collection')=='bookings' and item.get('after'):
            old=find_record(state,'bookings',item['id']);after=item['after']
            if old and (after.get('checkedInAt') and not old.checked_in_at or after.get('checkedOutAt') and not old.checked_out_at): movement_rooms.add(after['roomId'])
    order={'employees':-2,'salaryPayments':-1,'users':0,'guests':1,'bookings':2,'rooms':3,'finance':4,'settings':5,'notifications':6}
    for item in sorted(changes,key=lambda item:order.get(item.get('collection'),99)):
        kind=item['collection'];key=item['id'];after=item.get('after')
        if not isinstance(key,str) or len(key)>150: raise ValidationError('ID noto‘g‘ri.')
        if kind=='rooms' and key in movement_rooms:
            room=find_record(state,'rooms',key)
            expected=snapshot(state,request.user)['rooms']
            existing=next((value for value in expected if value['id']==key),None)
            if not existing or any(after.get(name)!=existing.get(name) for name in ['number','type','floor','capacity','pricePerNight','status','amenities','imageUrl','description']): raise PermissionDenied
            continue
        mutate(state,request.user,kind,key,after)
    state.revision+=1;state.save()
    return response(request,state)


def react_page(request, path=''):
    entry=settings.BASE_DIR.parent/'dist'/'index.html'
    if not entry.exists():
        if settings.FRONTEND_URL: return HttpResponseRedirect(settings.FRONTEND_URL + request.get_full_path())
        return HttpResponse('Avval loyiha ildizida npm run build bajaring.',status=503)
    html=entry.read_text().replace('<head>','<head><script>window.__HOTEL_SERVER__="django";</script>',1)
    return HttpResponse(html)

def react_asset(request,path):
    root=(settings.BASE_DIR.parent/'dist').resolve();target=(root/path).resolve()
    if not target.is_relative_to(root) or not target.is_file(): return HttpResponse(status=404)
    return FileResponse(target.open('rb'))

@endpoint
@transaction.atomic
def visit(request):
    if request.method!='POST': return JsonResponse({},status=405)
    values=body(request)
    state=lock_hotel_state()
    path=str(values.get('path','/'))[:500]
    if not path.startswith('/'): raise ValidationError('Sahifa manzili noto‘g‘ri.')
    state.payload['visits']=[{'id':f'visit-{uuid4()}','at':iso(timezone.now()),'path':path,'device':values.get('device') if values.get('device') in ['Mobil','Planshet','Desktop'] else 'Desktop','browser':str(values.get('browser','Boshqa'))[:40], 'userId':key_for(state,'users',request.user.pk) if request.user.is_authenticated else None,'userName':request.user.get_full_name() if request.user.is_authenticated else None,'userRole':role(request.user) if request.user.is_authenticated else None},*state.payload.get('visits',[])][:300]
    state.save(update_fields=['payload'])
    return response(request,state)


@endpoint
def health(request):
    if request.method != 'GET': return JsonResponse({},status=405)
    try:
        connection.ensure_connection()
        SiteState.objects.exists()
        Room.objects.exists()
        StaffMember.objects.exists()
        SalaryPayment.objects.exists()
        ReportSnapshot.objects.exists()
        from .models import ManagerDeviceSession
        ManagerDeviceSession.objects.exists()
        configured = get_user_model().objects.filter(is_superuser=True,is_active=True).exists()
    except DatabaseError:
        configured = False
    frontend = settings.FRONTEND_URL or 'https://strix-user.vercel.app'
    trusted = frontend in settings.CSRF_TRUSTED_ORIGINS
    durable = settings.HOTEL_DURABLE_STORAGE
    ready = configured and trusted and durable
    return JsonResponse({'service':'origin-hotel','apiVersion':1,'ready':ready,'trustedFrontend':trusted,'durableStorage':durable,'features':['manager-operations','staff-payroll','google-profile','owner-finance-control','manager-team-sync','site-editor-access','map-preview','manager-device-sessions']},status=200 if ready else 503,headers={'Cache-Control':'no-store, private'})


@endpoint
def live(request):
    if request.method != 'GET': return JsonResponse({},status=405)
    return JsonResponse({'service':'origin-hotel','apiVersion':1},headers={'Cache-Control':'no-store'})


@endpoint
def revision(request):
    if request.method != 'GET': return JsonResponse({},status=405)
    value=SiteState.objects.filter(pk=1).values_list('revision',flat=True).first()
    return JsonResponse({'revision':value or 0},headers={'Cache-Control':'no-store, private'})


@endpoint
@transaction.atomic
def manager_sessions(request):
    if not request.user.is_authenticated or not request.user.is_superuser: raise PermissionDenied
    if request.method not in ['GET','POST']: return JsonResponse({},status=405)
    from django.contrib.sessions.models import Session
    from .models import ManagerDeviceSession
    from .device_sessions import import_existing_sessions, device_label, valid_session
    state=lock_hotel_state()
    import_existing_sessions()
    removed=0
    if request.method=='POST':
        values=body(request)
        target=find_record(state,'users',str(values.get('managerId','')))
        if not target or target.is_superuser or not is_manager(target): raise PermissionDenied
        rows=ManagerDeviceSession.objects.filter(user=target,session__expire_date__gt=timezone.now())
        if values.get('all') is not True:
            if not values.get('sessionId'): raise ValidationError('Qurilmani tanlang.')
            rows=rows.filter(pk=values['sessionId'])
        keys=list(rows.values_list('session_id',flat=True));removed=len(keys)
        Session.objects.filter(pk__in=keys).delete()
        if removed:
            audit(request.user,'manager sessions revoked',target,{'event':'manager_sessions_revoked','sessionCount':removed})
            state.revision+=1;state.save()
    rows=ManagerDeviceSession.objects.filter(user__in=manager_accounts().filter(is_active=True),session__expire_date__gt=timezone.now()).select_related('session','user').order_by('-last_seen_at')
    items=[{'id':str(row.pk),'managerId':key_for(state,'users',row.user_id),'device':device_label(row.user_agent),'createdAt':iso(row.created_at),'lastSeenAt':iso(row.last_seen_at),'expiresAt':iso(row.session.expire_date),'legacy':not bool(row.user_agent)} for row in rows if valid_session(row.session,row.user)]
    return JsonResponse({'sessions':items,'revoked':removed},headers={'Cache-Control':'no-store, private'})
