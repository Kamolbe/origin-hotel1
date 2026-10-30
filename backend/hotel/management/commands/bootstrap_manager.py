import os
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q
from hotel.permissions import configure_manager, manager_accounts
from hotel.services import lock_hotel_state

class Command(BaseCommand):
    help = 'Render Environment orqali birinchi manager hisobi. Mavjud hisobni yoki parolni o‘zgartirmaydi.'
    @transaction.atomic
    def handle(self,*args,**options):
        lock_hotel_state()
        group=configure_manager();User=get_user_model()
        if manager_accounts().exists():
            self.stdout.write('Manager hisobi mavjud; hisob va bloklash holati o‘zgartirilmadi.');return
        email=os.environ.get('HOTEL_BOOTSTRAP_MANAGER_EMAIL','manager@manager.com').strip().lower()
        password=os.environ.get('HOTEL_BOOTSTRAP_MANAGER_PASSWORD','')
        if len(password)<12: raise CommandError('Manager paroli kamida 12 belgili bo‘lsin.')
        if User.objects.filter(Q(email__iexact=email)|Q(username__iexact=email)).exists(): raise CommandError('Email band; mavjud hisob avtomatik ko‘tarilmaydi.')
        user=User(username=email,email=email,first_name='Hotel',last_name='Manager',is_active=True)
        validate_password(password,user);user.full_clean(exclude=['password']);user.set_password(password);user.save();user.groups.add(group)
        self.stdout.write(self.style.SUCCESS('Manager yaratildi. Bootstrap parolini environment’dan olib tashlash mumkin.'))
