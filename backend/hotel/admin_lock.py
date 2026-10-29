from django.db import transaction
from .services import lock_hotel_state

class SerializedHotelWrites:
    """Apply the same write ordering to admin, React API and server forms."""
    def changeform_view(self, request, *args, **kwargs):
        if request.method != 'POST': return super().changeform_view(request,*args,**kwargs)
        with transaction.atomic():
            lock_hotel_state()
            return super().changeform_view(request,*args,**kwargs)
    def delete_view(self, request, *args, **kwargs):
        if request.method != 'POST': return super().delete_view(request,*args,**kwargs)
        with transaction.atomic():
            lock_hotel_state()
            return super().delete_view(request,*args,**kwargs)
    def changelist_view(self, request, *args, **kwargs):
        if request.method != 'POST': return super().changelist_view(request,*args,**kwargs)
        with transaction.atomic():
            lock_hotel_state()
            return super().changelist_view(request,*args,**kwargs)
