import os
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q
from hotel.services import lock_hotel_state

class Command(BaseCommand):
    help = 'Render Environment orqali birinchi adminni yaratadi; mavjud hisob paroli/rolini almashtirmaydi.'
    @transaction.atomic
    def handle(self,*args,**options):
        lock_hotel_state()
        User=get_user_model()
        if User.objects.filter(is_superuser=True,is_active=True).exists():
            self.stdout.write('Faol admin mavjud; hisob o‘zgartirilmadi.');return
        email=os.environ.get('HOTEL_BOOTSTRAP_ADMIN_EMAIL','admin@admin.com').strip().lower()
        password=os.environ.get('HOTEL_BOOTSTRAP_ADMIN_PASSWORD','')
        if len(password)<12: raise CommandError('HOTEL_BOOTSTRAP_ADMIN_PASSWORD: Render Environment’da kamida 12 belgili maxfiy parol sozlang.')
        if User.objects.filter(Q(username__iexact=email)|Q(email__iexact=email)).exists(): raise CommandError('Bu email bilan hisob mavjud. Avtomatik rol oshirilmaydi; boshqa admin emaili tanlang.')
        user=User(username=email,email=email,is_superuser=True,is_staff=True,is_active=True)
        try: validate_password(password,user);user.full_clean(exclude=['password'])
        except ValidationError: raise CommandError('Admin emaili yoki parol talablarga mos emas.') from None
        user.set_password(password);user.save()
        self.stdout.write(self.style.SUCCESS('Birinchi admin yaratildi. Bootstrap parolini Environment’dan olib tashlash mumkin.'))
