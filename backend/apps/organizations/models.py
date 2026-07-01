from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Organization(TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name


class Branch(TimeStampedModel):
    class BranchStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        OFFLINE = "offline", "Offline"

    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="branches")
    name = models.CharField(max_length=255)
    slug = models.SlugField()
    status = models.CharField(max_length=16, choices=BranchStatus.choices, default=BranchStatus.ACTIVE)
    working_hours = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    queue_prefix = models.CharField(max_length=8, default="A")
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_branches",
    )

    class Meta:
        ordering = ("name",)
        unique_together = ("organization", "slug")

    def __str__(self) -> str:
        return f"{self.organization.name} - {self.name}"


class Service(TimeStampedModel):
    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="services")
    branch = models.ForeignKey("organizations.Branch", on_delete=models.CASCADE, related_name="services")
    name = models.CharField(max_length=255)
    duration_minutes = models.PositiveIntegerField(default=5)
    queue_prefix = models.CharField(max_length=8)
    priority = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("name",)
        unique_together = ("branch", "name")

    def __str__(self) -> str:
        return self.name


class Counter(TimeStampedModel):
    class CounterStatus(models.TextChoices):
        OPEN = "open", "Open"
        PAUSED = "paused", "Paused"
        CLOSED = "closed", "Closed"

    organization = models.ForeignKey("organizations.Organization", on_delete=models.CASCADE, related_name="counters")
    branch = models.ForeignKey("organizations.Branch", on_delete=models.CASCADE, related_name="counters")
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=CounterStatus.choices, default=CounterStatus.OPEN)
    assigned_staff = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="assigned_counters")

    class Meta:
        ordering = ("name",)
        unique_together = ("branch", "name")

    def __str__(self) -> str:
        return f"{self.branch.name} - {self.name}"

