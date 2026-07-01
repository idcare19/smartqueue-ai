from django.db import models

from apps.core.models import TimeStampedModel


class PredictionSnapshot(TimeStampedModel):
    class ConfidenceLevel(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="prediction_snapshots")
    branch = models.ForeignKey("organizations.Branch", on_delete=models.CASCADE, related_name="prediction_snapshots")
    service = models.ForeignKey("organizations.Service", on_delete=models.SET_NULL, null=True, blank=True, related_name="prediction_snapshots")
    queue_length = models.PositiveIntegerField(default=0)
    active_counters = models.PositiveIntegerField(default=0)
    available_staff = models.PositiveIntegerField(default=0)
    estimated_wait_minutes = models.PositiveIntegerField(default=0)
    confidence = models.CharField(max_length=16, choices=ConfidenceLevel.choices, default=ConfidenceLevel.MEDIUM)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.branch.name} - {self.estimated_wait_minutes}m"

