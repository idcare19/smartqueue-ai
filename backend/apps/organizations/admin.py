from django.contrib import admin

from .models import Branch, Counter, Organization, Service


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "contact_email", "is_active")
    search_fields = ("name", "slug", "contact_email")
    list_filter = ("is_active",)


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "status", "working_hours", "manager")
    list_filter = ("status", "organization")
    search_fields = ("name", "slug", "organization__name")


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "branch", "duration_minutes", "queue_prefix", "priority", "is_active")
    list_filter = ("is_active", "organization", "branch")
    search_fields = ("name", "branch__name", "organization__name")


@admin.register(Counter)
class CounterAdmin(admin.ModelAdmin):
    list_display = ("name", "branch", "status", "organization")
    list_filter = ("status", "organization", "branch")
    search_fields = ("name", "branch__name", "organization__name")

