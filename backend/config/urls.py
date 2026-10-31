from django.contrib import admin
from django.urls import include, path, re_path
from hotel import react_api
from django.views.generic import RedirectView

urlpatterns = [
    path('django-admin/', admin.site.urls), path('management/', include('hotel.urls')),
    path('hotel-api/live/', react_api.live),
    path('hotel-api/health/', react_api.health),
    path('hotel-api/account-history/', react_api.account_history),
    path('hotel-api/manager-sessions/', react_api.manager_sessions),
    path('hotel-api/revision/', react_api.revision),
    path('hotel-api/visit/', react_api.visit),
    path('hotel-api/session/', react_api.session), path('hotel-api/state/', react_api.patch), path('hotel-api/auth/<str:action>/', react_api.auth),
    path('assets/<path:path>', lambda request,path: react_api.react_asset(request,'assets/'+path)),
    path('favicon.svg', lambda request: react_api.react_asset(request,'favicon.svg')),
    path('robots.txt', lambda request: react_api.react_asset(request,'robots.txt')),
    path('sitemap.xml', lambda request: react_api.react_asset(request,'sitemap.xml')),
    path('images/<path:path>', lambda request,path: react_api.react_asset(request,'images/'+path)),
    re_path(r'^(?P<path>.*)$', react_api.react_page),
]
