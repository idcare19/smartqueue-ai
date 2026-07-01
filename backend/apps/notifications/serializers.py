from rest_framework import serializers

from .models import Notification, NotificationLog, NotificationStatus, NotificationTemplate


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = ("id", "name", "event_type", "channel", "subject", "body", "is_active", "created_at", "updated_at")


class NotificationLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationLog
        fields = ("id", "notification", "provider", "status", "request_payload", "response_payload", "error_message", "attempted_at")


class NotificationSerializer(serializers.ModelSerializer):
    queue_token_number = serializers.CharField(source="queue_token.token_number", read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "channel",
            "event_type",
            "status",
            "provider",
            "title",
            "message",
            "destination",
            "queue_token",
            "queue_token_number",
            "retry_count",
            "max_retries",
            "sent_at",
            "delivered_at",
            "read_at",
            "created_at",
        )


class MarkReadSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[NotificationStatus.READ])


class NotificationStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    unread = serializers.IntegerField()
    failed = serializers.IntegerField()
    delivered = serializers.IntegerField()
    providers = serializers.ListField()
