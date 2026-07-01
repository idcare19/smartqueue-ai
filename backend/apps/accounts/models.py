from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    SUPER_ADMIN = "super_admin", "Super Admin"
    ORGANIZATION_ADMIN = "organization_admin", "Organization Admin"
    BRANCH_MANAGER = "branch_manager", "Branch Manager"
    STAFF = "staff", "Staff"
    RECEPTIONIST = "receptionist", "Receptionist"


class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=32, choices=UserRole.choices, default=UserRole.STAFF)
    organization_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=32, blank=True)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    branch = models.ForeignKey(
        "organizations.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self) -> str:
        return self.email
