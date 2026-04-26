from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView

urlpatterns = [
    path('', views.home, name='home'),
    path("signup/", views.signup_view, name="signup"),
    path("login/", views.login_view, name="login"),
    path("donation/", views.donations, name="donation"),
    path("donate/", views.donate, name="donate"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path('api/donations/', views.api_donations, name='api_donations'),
    path('api/create-donation/', views.api_create_donation, name='api_create_donation'),
    
    path("dashboard/", views.dashboard, name="dashboard"),
    path("pickup/<int:donation_id>/", views.pickup_donation_volunteer, name="pickup_donation_volunteer"),
    path("volunteer/", views.volunteer_dashboard, name="volunteer_dashboard"),
    path("analytics/", views.analytics, name="analytics"),
    path("verify/<int:donation_id>/", views.verify_pickup, name="verify_pickup"),
    path('upload_qr/<int:donation_id>/', views.upload_qr, name='upload_qr'),
    path('api/check-donation-status/<int:donation_id>/', views.check_donation_status, name='check_donation_status'),
    
    path('rewards/', views.rewards, name='rewards'),

]