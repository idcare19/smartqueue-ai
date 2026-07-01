from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Branch, Counter, Department, Organization, Service

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name", "slug", "contact_email", "contact_phone", "logo", "is_active", "created_at", "updated_at")


class BranchSerializer(serializers.ModelSerializer):
    manager_email = serializers.EmailField(source="manager.email", read_only=True)
    queue = serializers.SerializerMethodField()
    staff = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = (
            "id",
            "organization",
            "name",
            "slug",
            "status",
            "working_hours",
            "timezone",
            "logo",
            "address",
            "queue_prefix",
            "is_active",
            "manager",
            "manager_email",
            "queue",
            "staff",
            "created_at",
            "updated_at",
        )

    def get_staff(self, obj):
        return obj.users.count()

    def get_queue(self, obj):
        return obj.queue_tokens.count()


class ServiceSerializer(serializers.ModelSerializer):
    duration = serializers.IntegerField(source="duration_minutes")
    prefix = serializers.CharField(source="queue_prefix")
    status = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = (
            "id",
            "organization",
            "branch",
            "name",
            "duration",
            "prefix",
            "priority",
            "status",
            "is_active",
            "created_at",
            "updated_at",
        )

    def get_status(self, obj):
        return "Active" if obj.is_active else "Inactive"


class CounterSerializer(serializers.ModelSerializer):
    staff = serializers.SerializerMethodField()
    currentToken = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Counter
        fields = (
            "id",
            "organization",
            "branch",
            "branch_name",
            "name",
            "status",
            "is_active",
            "staff",
            "currentToken",
            "assigned_staff",
            "created_at",
            "updated_at",
        )

    def get_staff(self, obj):
        return ", ".join(obj.assigned_staff.values_list("first_name", flat=True)[:3]) or "Unassigned"

    def get_currentToken(self, obj):
        token = obj.queue_tokens.exclude(status__in=["completed", "cancelled", "no_show"]).order_by("created_at").first()
        return token.token_number if token else "--"


class DepartmentSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Department
        fields = ("id", "organization", "branch", "branch_name", "name", "slug", "description", "is_active", "created_at", "updated_at")
