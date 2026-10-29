from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

urlpatterns = [path('', RedirectView.as_view(url='/management/', permanent=False)), path('django-admin/', admin.site.urls), path('management/', include('hotel.urls'))]
