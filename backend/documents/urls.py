from django.urls import path

from . import views

urlpatterns = [
    path('hotel-api/documents/', views.collection, name='documents-collection'),
    path('hotel-api/documents/<uuid:pk>/', views.detail, name='documents-detail'),
]
