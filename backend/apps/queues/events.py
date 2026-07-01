from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.analytics.services import create_prediction_snapshot, estimate_wait_time
from .models import QueueToken


def queue_group_names(token: QueueToken):
    groups = {
        f"organization_{token.organization_id}",
        f"branch_{token.branch_id}",
        f"service_{token.service_id}",
        "public_display",
    }
    if token.counter_id:
        groups.add(f"counter_{token.counter_id}")
    groups.add(f"customer_{token.token_number.lower()}")
    return groups


def serialize_queue_event(token: QueueToken, event_type: str):
    prediction = estimate_wait_time(token.branch, token.service)
    return {
        "event": event_type,
        "token": {
            "id": token.id,
            "organization": token.organization_id,
            "branch": token.branch_id,
            "branch_name": token.branch.name if token.branch_id else "",
            "service": token.service_id,
            "service_name": token.service.name if token.service_id else "",
            "counter": token.counter_id,
            "counter_name": token.counter.name if token.counter_id else "",
            "customer_name": token.customer_name,
            "mobile_number": token.mobile_number,
            "token_number": token.token_number,
            "sequence_number": token.sequence_number,
            "status": token.status,
            "note": token.note,
            "queue_date": token.queue_date.isoformat(),
            "estimated_wait_minutes": prediction.estimated_wait_minutes,
            "confidence": prediction.confidence,
        },
    }


def broadcast_queue_event(token: QueueToken, event_type: str):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    create_prediction_snapshot(token.branch, token.service)
    payload = serialize_queue_event(token, event_type)
    for group in queue_group_names(token):
        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "queue.event",
                "payload": payload,
            },
        )
