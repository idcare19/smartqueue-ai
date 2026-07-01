from django.contrib import admin

from .models import Notification, NotificationLog, NotificationTemplate


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "event_type", "channel", "is_active", "updated_at")
    list_filter = ("event_type", "channel", "is_active")
    search_fields = ("name", "subject", "body")


from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .tasks import retry_failed_notification_task

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "event_type", "channel", "status", "retry_count", "max_retries", "next_retry_at", "destination", "provider", "created_at")
    list_filter = ("event_type", "channel", "status", "provider")
    search_fields = ("destination", "message", "title", "queue_token__token_number", "recipient_user__email")
    readonly_fields = ("metadata",)
    actions = ['retry_failed_notifications']
    
    def retry_failed_notifications(self, request, queryset):
        """Retry selected failed notifications"""
        count = 0
        for notification in queryset.filter(status="failed"):
            if notification.retry_count < notification.max_retries:
                retry_failed_notification_task.delay(notification.id)
                count += 1
        self.message_user(request, _(f"{count} failed notifications have been queued for retry."))
    retry_failed_notifications.short_description = _("Retry selected failed notifications")


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("notification", "provider", "status", "attempted_at")
    list_filter = ("status", "provider")
    search_fields = ("notification__destination", "error_message")
    readonly_fields = ("request_payload", "response_payload")