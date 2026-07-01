from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "username", "first_name", "last_name", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("email", "username", "first_name", "last_name")
    ordering = ("email",)
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "SmartQueue Access",
            {
                "fields": ("role", "organization_name", "phone_number", "organization", "branch"),
            },
        ),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "SmartQueue Access",
            {
                "classes": ("wide",),
                "fields": ("email", "role", "organization_name", "phone_number", "organization", "branch"),
            },
        ),
    )
