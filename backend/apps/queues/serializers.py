from django.utils import timezone
from django.db.models import Max
from rest_framework import serializers

from apps.analytics.services import estimate_wait_time
from apps.organizations.models import Branch, Counter, Service

from .models import QueueToken


class QueueTokenSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    service_name = serializers.CharField(source="service.name", read_only=True)
    counter_name = serializers.CharField(source="counter.name", read_only=True)
    estimated_wait_minutes = serializers.SerializerMethodField()
    confidence = serializers.SerializerMethodField()

    class Meta:
        model = QueueToken
        fields = (
            "id",
            "organization",
            "branch",
            "branch_name",
            "service",
            "service_name",
            "counter",
            "counter_name",
            "customer_name",
            "mobile_number",
            "token_number",
            "sequence_number",
            "status",
            "note",
            "called_at",
            "serving_at",
            "completed_at",
            "queue_date",
            "created_at",
            "estimated_wait_minutes",
            "confidence",
        )
        read_only_fields = ("token_number", "sequence_number", "status", "called_at", "serving_at", "completed_at", "queue_date")

    def get_estimated_wait_minutes(self, obj):
        return estimate_wait_time(obj.branch, obj.service).estimated_wait_minutes

    def get_confidence(self, obj):
        return estimate_wait_time(obj.branch, obj.service).confidence


class JoinQueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = QueueToken
        fields = ("branch", "service", "customer_name", "mobile_number")

    def validate(self, attrs):
        branch = attrs["branch"]
        service = attrs["service"]
        if service.branch_id != branch.id:
            raise serializers.ValidationError("Selected service does not belong to this branch.")
        if not service.is_active:
            raise serializers.ValidationError("Selected service is not active.")
        return attrs

    def create(self, validated_data):
        branch: Branch = validated_data["branch"]
        service: Service = validated_data["service"]
        queue_date = timezone.localdate()
        next_sequence = (
            branch.queue_tokens.filter(queue_date=queue_date).aggregate(max_sequence=Max("sequence_number"))["max_sequence"] or 0
        ) + 1
        token_number = f"{service.queue_prefix.upper()}-{next_sequence:03d}"
        return QueueToken.objects.create(
            organization=branch.organization,
            token_number=token_number,
            sequence_number=next_sequence,
            queue_date=queue_date,
            **validated_data,
        )


class QueueActionSerializer(serializers.Serializer):
    counter = serializers.PrimaryKeyRelatedField(queryset=Counter.objects.all(), required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True)
