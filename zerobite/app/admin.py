# app/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Donation


# Custom User admin
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("username", "email", "phone", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active")
    search_fields = ("username", "email", "phone")
    ordering = ("username",)

    fieldsets = UserAdmin.fieldsets + (
        (None, {"fields": ("phone",)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {"fields": ("phone",)}),
    )


# Donation admin
@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ("item_name", "donor", "status", "quantity", "unit", "date_available", "created_at")
    list_filter = ("status", "food_type", "date_available", "created_at")
    search_fields = ("item_name", "donor__username", "donor__email", "pickup_location")
    readonly_fields = ("qr_code", "created_at", "updated_at")
