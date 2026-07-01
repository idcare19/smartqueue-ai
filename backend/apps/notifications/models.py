from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class NotificationChannel(models.TextChoices):
    SMS = "sms", "SMS"
    WHATSAPP = "whatsapp", "WhatsApp"
    EMAIL = "email", "Email"
    IN_APP = "in_app", "In-App"
    PUSH = "push", "Push"


class NotificationEvent(models.TextChoices):
    QUEUE_JOINED = "queue_joined", "Queue Joined"
    TOKEN_CALLED = "token_called", "Token Called"
    TOKEN_RECALLED = "token_recalled", "Token Recalled"
    QUEUE_DELAYED = "queue_delayed", "Queue Delayed"
    QUEUE_CANCELLED = "queue_cancelled", "Queue Cancelled"
    APPOINTMENT_REMINDER = "appointment_reminder", "Appointment Reminder"
    QUEUE_COMPLETED = "queue_completed", "Queue Completed"
    FEEDBACK_REQUEST = "feedback_request", "Feedback Request"


class NotificationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PROCESSING = "processing", "Processing"
    SENT = "sent", "Sent"
    DELIVERED = "delivered", "Delivered"
    FAILED = "failed", "Failed"
    READ = "read", "Read"
    EXPIRED = "expired", "Expired"


class NotificationTemplate(TimeStampedModel):
    name = models.CharField(max_length=255)
    event_type = models.CharField(max_length=32, choices=NotificationEvent.choices)
    channel = models.CharField(max_length=16, choices=NotificationChannel.choices)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("event_type", "channel", "name")
        unique_together = ("event_type", "channel", "name")

    def __str__(self) -> str:
        return f"{self.name} ({self.channel})"


class Notification(TimeStampedModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    queue_token = models.ForeignKey(
        "queues.QueueToken",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    template = models.ForeignKey(
        "notifications.NotificationTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    recipient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    channel = models.CharField(max_length=16, choices=NotificationChannel.choices)
    event_type = models.CharField(max_length=32, choices=NotificationEvent.choices)
    status = models.CharField(max_length=16, choices=NotificationStatus.choices, default=NotificationStatus.PENDING)
    provider = models.CharField(max_length=64, blank=True)
    title = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    destination = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    retry_count = models.PositiveSmallIntegerField(default=0)
    max_retries = models.PositiveSmallIntegerField(default=3)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.get_channel_display()} {self.get_event_type_display()} -> {self.destination or self.recipient_user_id or 'stream'}"


class NotificationLog(TimeStampedModel):
    notification = models.ForeignKey(
        "notifications.Notification",
        on_delete=models.CASCADE,
        related_name="logs",
    )
    provider = models.CharField(max_length=64, blank=True)
    status = models.CharField(max_length=16, choices=NotificationStatus.choices)
    request_payload = models.JSONField(default=dict, blank=True)
    response_payload = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-attempted_at",)

    def __str__(self) -> str:
        return f"{self.notification_id} {self.status}"