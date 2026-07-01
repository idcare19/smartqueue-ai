from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class AuditActionType(models.TextChoices):
    # Queue actions
    QUEUE_CREATED = "queue_created", "Queue Created"
    QUEUE_UPDATED = "queue_updated", "Queue Updated"
    QUEUE_DELETED = "queue_deleted", "QueueDeleted"
    TOKEN_JOINED = "token_joined", "Token Joined"
    TOKEN_CALLED = "token_called", "Token Called"
    TOKEN_RECALLED = "token_recalled", "Token Recalled"
    TOKEN_CANCELLED = "token_cancelled", "Token Cancelled"
    TOKEN_COMPLETED = "token_completed", "Token Completed"
    
    # Staff actions
    STAFF_LOGIN = "staff_login", "Staff Login"
    STAFF_LOGOUT = "staff_logout", "Staff Logout"
    STAFF_ASSIGNED = "staff_assigned", "Staff Assigned"
    
    # Admin actions
    ADMIN_USER_CREATED = "admin_user_created", "Admin User Created"
    ADMIN_USER_UPDATED = "admin_user_updated", "Admin User Updated"
    ADMIN_ORGANIZATION_UPDATED = "admin_org_updated", "Organization Updated"
    ADMIN_BRANCH_CREATED = "admin_branch_created", "Branch Created"
    ADMIN_BRANCH_UPDATED = "admin_branch_updated", "Branch Updated"
    ADMIN_SETTINGS_CHANGED = "admin_settings_changed", "Settings Changed"
    
    # Notification actions
    NOTIFICATION_SENT = "notification_sent", "Notification Sent"
    NOTIFICATION_FAILED = "notification_failed", "Notification Failed"
    NOTIFICATION_RETRY_ATTEMPTED = "notification_retry_attempted", "Notification Retry Attempted"
    NOTIFICATION_BULK_SENT = "notification_bulk_sent", "Bulk Notifications Sent"
    
    # Provider actions
    PROVIDER_REQUEST = "provider_request", "Provider API Request"
    PROVIDER_FAILURE = "provider_failure", "Provider API Failure"
    
    # Security actions
    LOGIN_FAILED = "login_failed", "Login Failed"
    LOGIN_SUCCESS = "login_success", "Login Successful"
    UNAUTHORIZED_ACCESS = "unauthorized_access", "Unauthorized Access Attempt"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded", "Rate Limit Exceeded"


class AuditLog(models.Model):
    """Comprehensive audit log for all system activities"""
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="audit_logs",
        null=True,
        blank=True
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.CASCADE,
        related_name="audit_logs",
        null=True,
        blank=True
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="action_logs",
        null=True,
        blank=True
    )
    actor_ip = models.GenericIPAddressField(null=True, blank=True)
    actor_user_agent = models.TextField(blank=True)
    
    action_type = models.CharField(max_length=64, choices=AuditActionType.choices)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Generic relation to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action_type', 'created_at']),
            models.Index(fields=['organization_id', 'created_at']),
            models.Index(fields=['actor_id', 'created_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        actor_str = self.actor.email if self.actor else "system"
        return f"{self.action_type} by {actor_str} at {self.created_at}"


def create_audit_log(
    action_type: str,
    actor=None,
    request=None,
    organization=None,
    branch=None,
    content_object=None,
    description: str = "",
    metadata: dict = None
):
    """Helper function to create audit logs with proper context"""
    audit_log = AuditLog()
    audit_log.action_type = action_type
    
    if actor:
        audit_log.actor = actor
    
    if request:
        audit_log.actor_ip = request.META.get('REMOTE_ADDR')
        audit_log.actor_user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    if organization:
        audit_log.organization = organization
    elif actor and hasattr(actor, 'organization'):
        audit_log.organization = actor.organization
    
    if branch:
        audit_log.branch = branch
    elif actor and hasattr(actor, 'branch'):
        audit_log.branch = actor.branch
    
    if content_object:
        audit_log.content_object = content_object
    
    audit_log.description = description
    audit_log.metadata = metadata or {}
    audit_log.save()
    
    return audit_log