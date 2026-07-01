from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "action_type", "actor", "organization", "branch", "created_at")
    list_filter = ("action_type", "created_at", "organization", "branch")
    search_fields = ("description", "actor__email", "metadata")
    readonly_fields = ("action_type", "actor_ip", "actor_user_agent", "metadata", "created_at")
    date_hierarchy = "created_at"
    
    def has_add_permission(self, request):
        return False  # Audit logs are only created programmatically
    
    def has_change_permission(self, request, obj=None):
        return False  # Audit logs are immutable
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser  # Only superusers can delete audit logs