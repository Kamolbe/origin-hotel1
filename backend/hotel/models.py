from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models

class Room(models.Model):
    TYPES = [('Standard', 'Standard'), ('Deluxe', 'Deluxe'), ('Suite', 'Suite'), ('Family', 'Family'), ('Presidential', 'Presidential')]
    STATUSES = [('available', 'Bo‘sh'), ('occupied', 'Band'), ('cleaning', 'Tozalashda'), ('maintenance', 'Ta’mirda')]
    number = models.CharField('Xona raqami', max_length=20, unique=True)
    room_type = models.CharField('Xona turi', max_length=20, choices=TYPES)
    price = models.DecimalField('Narx / tun (UZS)', max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    capacity = models.PositiveSmallIntegerField('Sig‘im', validators=[MinValueValidator(1)])
    floor = models.PositiveSmallIntegerField('Qavat', default=1, validators=[MinValueValidator(1)])
    status = models.CharField('Holat', max_length=20, choices=STATUSES, default='available')
    class Meta:
        ordering = ['floor', 'number']
        constraints = [models.CheckConstraint(condition=models.Q(price__gt=0), name='room_positive_price'), models.CheckConstraint(condition=models.Q(capacity__gt=0), name='room_positive_capacity')]
    def __str__(self): return f'{self.number} · {self.room_type}'

class Guest(models.Model):
    first_name = models.CharField('Ism', max_length=80)
    last_name = models.CharField('Familiya', max_length=80)
    email = models.EmailField('Email', blank=True)
    phone = models.CharField('Telefon', max_length=40, blank=True)
    nationality = models.CharField('Fuqarolik', max_length=80, blank=True)
    passport_number = models.CharField('Test pasport raqami', max_length=35, blank=True, validators=[RegexValidator(r'^TEST-[A-Z0-9-]{3,30}$', 'Faqat TEST- bilan boshlanuvchi sun’iy raqam ishlating.')])
    notes = models.TextField('Izoh', blank=True)
    archived = models.BooleanField('Arxivlangan', default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['last_name', 'first_name']
    def __str__(self): return f'{self.first_name} {self.last_name}'

class Booking(models.Model):
    STATUSES = [('pending', 'Kutilmoqda'), ('confirmed', 'Tasdiqlangan'), ('rejected', 'Rad etilgan'), ('cancelled', 'Bekor qilingan'), ('completed', 'Tugatilgan')]
    guest = models.ForeignKey(Guest, on_delete=models.PROTECT, verbose_name='Mehmon')
    room = models.ForeignKey(Room, on_delete=models.PROTECT, verbose_name='Xona')
    check_in = models.DateField('Kelish sanasi')
    check_out = models.DateField('Ketish sanasi')
    status = models.CharField('Holat', max_length=15, choices=STATUSES, default='confirmed')
    adults = models.PositiveSmallIntegerField('Kattalar', default=1, validators=[MinValueValidator(1)])
    children = models.PositiveSmallIntegerField('Bolalar', default=0)
    total_amount = models.DecimalField('Jami (UZS)', max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    notes = models.TextField('Izoh', blank=True)
    checked_in_at = models.DateTimeField('Haqiqiy kelish', null=True, blank=True)
    checked_out_at = models.DateTimeField('Haqiqiy ketish', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']
        constraints = [models.CheckConstraint(condition=models.Q(check_out__gt=models.F('check_in')), name='booking_dates_ordered'), models.CheckConstraint(condition=models.Q(total_amount__gte=0), name='booking_nonnegative_total')]
    def clean(self):
        errors = {}
        if self.check_in and self.check_out and self.check_out <= self.check_in: errors['check_out'] = 'Ketish kelishdan keyin bo‘lishi shart.'
        if self.room_id and self.adults is not None and self.children is not None and self.adults + self.children > self.room.capacity: errors['adults'] = 'Mehmonlar soni xona sig‘imidan oshdi.'
        if self.guest_id and self.guest.archived: errors['guest'] = 'Arxivdagi mehmon uchun yangi bron yaratilmaydi.'
        if self.room_id and self.status in ['pending', 'confirmed'] and self.check_in and self.check_out:
            overlaps = Booking.objects.filter(room_id=self.room_id, status__in=['pending', 'confirmed'], check_in__lt=self.check_out, check_out__gt=self.check_in).exclude(pk=self.pk)
            if overlaps.exists(): errors['room'] = 'Bu sanalarda xona band: ustma-ust bron yaratib bo‘lmaydi.'
        if errors: raise ValidationError(errors)
    def __str__(self): return f'BR-{self.pk} · {self.guest}'

INCOME_CATEGORIES = [('room_revenue', 'Xona haqi'), ('food_and_beverage', 'Ovqatlanish'), ('additional_services', 'Qo‘shimcha xizmatlar'), ('rental', 'Ijara'), ('other', 'Boshqa kirim')]
EXPENSE_CATEGORIES = [('payroll', 'Ish haqi'), ('utilities', 'Kommunal to‘lovlar'), ('supplies', 'Material va xaridlar'), ('maintenance', 'Ta’mirlash'), ('other', 'Boshqa chiqim')]

class FinanceEntry(models.Model):
    entry_type = models.CharField('Turi', max_length=10, choices=[('income', 'Kirim'), ('expense', 'Chiqim')])
    category = models.CharField('Kategoriya', max_length=30)
    amount = models.DecimalField('Summa (UZS)', max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    date = models.DateField('Sana')
    description = models.CharField('Izoh', max_length=500)
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Bron (ixtiyoriy)')
    class Meta:
        ordering = ['-date', '-pk']
        constraints = [models.CheckConstraint(condition=models.Q(amount__gt=0), name='finance_positive_amount')]
    def clean(self):
        if self.pk and SalaryPayment.objects.filter(finance_id=self.pk).exists():
            original=FinanceEntry.objects.get(pk=self.pk)
            if any(getattr(original,key)!=getattr(self,key) for key in ['entry_type','category','amount','date','description','booking_id']): raise ValidationError('Ish haqi to‘lovining moliyaviy tarixi himoyalangan.')
        allowed = INCOME_CATEGORIES if self.entry_type == 'income' else EXPENSE_CATEGORIES
        if self.category not in dict(allowed): raise ValidationError({'category': 'Yozuv turiga mos kategoriya tanlang.'})
    def get_category_display(self): return dict(INCOME_CATEGORIES + EXPENSE_CATEGORIES).get(self.category, self.category)
    def __str__(self): return self.description

class AuditEntry(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=250)
    entity = models.CharField(max_length=60)
    entity_id = models.CharField(max_length=60)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-created_at']

class SiteState(models.Model):
    """Public site settings and UI extras; relational hotel records remain authoritative."""
    payload = models.JSONField(default=dict)
    revision = models.PositiveBigIntegerField(default=0)

class StaffMember(models.Model):
    name = models.CharField(max_length=160)
    job_title = models.CharField(max_length=120)
    phone = models.CharField(max_length=25, validators=[RegexValidator(r'^\+?[0-9]{9,15}$', 'Telefon 9–15 ta raqamdan iborat bo‘lsin.')])
    email = models.EmailField(blank=True)
    monthly_salary = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    start_date = models.DateField()
    payday = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    notes = models.TextField(blank=True, max_length=2000)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['name']
        constraints = [models.CheckConstraint(condition=models.Q(monthly_salary__gt=0), name='staff_positive_salary'), models.CheckConstraint(condition=models.Q(payday__gte=1,payday__lte=31), name='staff_valid_payday')]
    def clean(self):
        if self.payday and self.payday > 31: raise ValidationError('Oylik kuni 1–31 oralig‘ida bo‘lsin.')
    def __str__(self): return self.name

class SalaryPayment(models.Model):
    employee = models.ForeignKey(StaffMember, on_delete=models.PROTECT, related_name='payments')
    period = models.DateField(help_text='Hisob oyi, oyning birinchi kuni.')
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    paid_at = models.DateTimeField(auto_now_add=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    finance = models.OneToOneField(FinanceEntry, on_delete=models.PROTECT)
    class Meta:
        ordering = ['-paid_at']
        constraints = [models.UniqueConstraint(fields=['employee','period'],name='staff_one_salary_per_month')]
    def __str__(self): return f'{self.employee} · {self.period:%Y-%m}'
