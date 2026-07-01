from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel


class QueueToken(TimeStampedModel):
    class QueueStatus(models.TextChoices):
        WAITING = "waiting", "Waiting"
        CALLED = "called", "Called"
        SERVING = "serving", "Serving"
        COMPLETED = "completed", "Completed"
        SKIPPED = "skipped", "Skipped"
        NO_SHOW = "no_show", "No Show"
        CANCELLED = "cancelled", "Cancelled"

    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="queue_tokens")
    branch = models.ForeignKey("organizations.Branch", on_delete=models.CASCADE, related_name="queue_tokens")
    service = models.ForeignKey("organizations.Service", on_delete=models.CASCADE, related_name="queue_tokens")
    counter = models.ForeignKey(
        "organizations.Counter",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="queue_tokens",
    )
    customer_name = models.CharField(max_length=255)
    mobile_number = models.CharField(max_length=32)
    token_number = models.CharField(max_length=32)
    sequence_number = models.PositiveIntegerField()
    status = models.CharField(max_length=16, choices=QueueStatus.choices, default=QueueStatus.WAITING)
    note = models.CharField(max_length=255, blank=True)
    queue_type = models.CharField(max_length=32, default="walk_in")
    priority = models.CharField(max_length=16, default="normal")
    is_paused = models.BooleanField(default=False)
    is_open = models.BooleanField(default=True)
    transferred_from_counter = models.ForeignKey(
        "organizations.Counter",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transferred_queue_tokens",
    )
    called_at = models.DateTimeField(null=True, blank=True)
    serving_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    queue_date = models.DateField(default=timezone.localdate)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_queue_tokens",
    )

    class Meta:
        ordering = ("-created_at",)
        unique_together = ("branch", "queue_date", "sequence_number")

    def __str__(self) -> str:
        return self.token_number
