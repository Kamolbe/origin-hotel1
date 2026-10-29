from django.contrib.auth import views as auth_views
from django.urls import path
from . import views
app_name = 'hotel'
urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('login/', auth_views.LoginView.as_view(template_name='hotel/login.html', redirect_authenticated_user=True), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('reports/', views.reports, name='reports'),
    path('modules/<str:kind>/', views.module_list, name='list'),
    path('modules/<str:kind>/new/', views.edit_record, name='new'),
    path('modules/<str:kind>/<int:pk>/edit/', views.edit_record, name='edit'),
    path('bookings/<int:pk>/<str:action>/', views.booking_action, name='booking-action'),
]
