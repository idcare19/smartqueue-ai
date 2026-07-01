from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification


def notification_group_names(notification: Notification):
    groups = {
        f"organization_{notification.organization_id}",
        f"branch_{notification.branch_id}",
    }
    if notification.queue_token_id:
        groups.add(f"customer_{notification.queue_token.token_number.lower()}")
    return groups


def serialize_notification_event(notification: Notification):
    return {
        "event": "notification.created",
        "notification": {
            "id": notification.id,
            "channel": notification.channel,
            "event_type": notification.event_type,
            "status": notification.status,
            "title": notification.title,
            "message": notification.message,
            "destination": notification.destination,
            "provider": notification.provider,
            "queue_token": notification.queue_token.token_number if notification.queue_token_id else "",
            "read_at": notification.read_at.isoformat() if notification.read_at else None,
            "created_at": notification.created_at.isoformat(),
        },
    }


def broadcast_notification_event(notification: Notification):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    payload = serialize_notification_event(notification)
    for group in notification_group_names(notification):
        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "queue.event",
                "payload": payload,
            },
        )
