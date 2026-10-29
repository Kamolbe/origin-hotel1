from django import forms
from .models import Room, Guest, Booking, FinanceEntry, INCOME_CATEGORIES, EXPENSE_CATEGORIES

class StyledForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-select' if isinstance(field.widget, forms.Select) else 'form-control'
            if isinstance(field.widget, forms.Textarea): field.widget.attrs['rows'] = 3

class RoomForm(StyledForm):
    class Meta: model = Room; fields = ['number', 'room_type', 'floor', 'price', 'capacity', 'status']
    def clean_status(self):
        status = self.cleaned_data['status']
        if self.instance.pk and self.instance.booking_set.filter(checked_in_at__isnull=False, checked_out_at__isnull=True, status='confirmed').exists() and status != 'occupied':
            raise forms.ValidationError('Joylashgan mehmon uchun avval Check-out bajaring.')
        return status

class GuestForm(StyledForm):
    class Meta: model = Guest; fields = ['first_name', 'last_name', 'email', 'phone', 'nationality', 'passport_number', 'notes']

class BookingForm(StyledForm):
    class Meta:
        model = Booking
        fields = ['guest', 'room', 'check_in', 'check_out', 'adults', 'children', 'total_amount', 'notes']
        widgets = {'check_in': forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d'), 'check_out': forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d')}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['guest'].queryset = Guest.objects.filter(archived=False)
        self.fields['room'].queryset = Room.objects.exclude(status__in=['cleaning', 'maintenance'])

class FinanceForm(StyledForm):
    category = forms.ChoiceField(label='Kategoriya')
    class Meta:
        model = FinanceEntry
        fields = ['entry_type', 'category', 'amount', 'date', 'description', 'booking']
        widgets = {'date': forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d')}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        kind = self.data.get('entry_type') or self.initial.get('entry_type') or self.instance.entry_type or 'income'
        self.fields['category'].choices = INCOME_CATEGORIES if kind == 'income' else EXPENSE_CATEGORIES

class DateRangeForm(forms.Form):
    start = forms.DateField(label='Boshlanish sanasi', widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}, format='%Y-%m-%d'))
    end = forms.DateField(label='Tugash sanasi', widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}, format='%Y-%m-%d'))
    def clean(self):
        data = super().clean()
        if data.get('start') and data.get('end') and data['end'] < data['start']: raise forms.ValidationError('Tugash sanasi boshlanishdan oldin bo‘lmasin.')
        if data.get('start') and data.get('end') and (data['end'] - data['start']).days > 3660: raise forms.ValidationError('Bir hisobot uchun ko‘pi bilan 10 yil tanlang.')
        return data
