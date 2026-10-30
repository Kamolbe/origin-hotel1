import calendar
from datetime import date
from django.utils import timezone
from .models import StaffMember

def due_notifications(user_id, read_ids):
    today=timezone.localdate();notes=[]
    for employee in StaffMember.objects.filter(is_active=True).prefetch_related('payments'):
        paid={payment.period for payment in employee.payments.all()}
        cursor=employee.start_date.replace(day=1)
        while cursor<=today.replace(day=1):
            due=cursor.replace(day=min(employee.payday,calendar.monthrange(cursor.year,cursor.month)[1]))
            if employee.start_date<=due<=today and cursor not in paid:
                key=f'payroll-due-{employee.pk}-{cursor:%Y-%m}-{user_id}'
                notes.append({'id':key,'userId':user_id,'type':'finance','title':'Oylik to‘lov muddati keldi','message':f'{employee.name} · {cursor:%Y-%m} · {employee.monthly_salary:,.0f} UZS','read':key in read_ids,'createdAt':due.isoformat()+'T00:00:00Z'})
            cursor=date(cursor.year+1,1,1) if cursor.month==12 else date(cursor.year,cursor.month+1,1)
    return sorted(notes,key=lambda note:note['createdAt'],reverse=True)
