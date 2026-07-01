from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings
from django.db.models import Count, Q
from django.template import Context, Template
from django.utils import timezone

from apps.accounts.models import User, UserRole
from apps.queues.models import QueueToken

from .events import broadcast_notification_event
from .models import (
    Notification,
    NotificationChannel,
    NotificationEvent,
    NotificationLog,
    NotificationStatus,
    NotificationTemplate,
)
from .providers import PROVIDER_REGISTRY

DEFAULT_TEMPLATE_BODIES = {
    NotificationEvent.QUEUE_JOINED: "Hello {{ customer_name }}\n\nYour token {{ token }} has joined the queue at {{ branch_name }}.",
    NotificationEvent.TOKEN_CALLED: "Hello {{ customer_name }}\n\nYour token {{ token }} is now being called at {{ branch_name }}. Please proceed to Counter {{ counter }}.",
    NotificationEvent.TOKEN_RECALLED: "Hello {{ customer_name }}\n\nYour token {{ token }} is being recalled at {{ branch_name }}. Please proceed to Counter {{ counter }}.",
    NotificationEvent.QUEUE_DELAYED: "Hello {{ customer_name }}\n\nThere is a delay for token {{ token }} at {{ branch_name }}. Updated wait time: {{ estimated_wait_minutes }} minutes.",
    NotificationEvent.QUEUE_CANCELLED: "Hello {{ customer_name }}\n\nYour token {{ token }} at {{ branch_name }} has been cancelled. Please contact reception for assistance.",
    NotificationEvent.APPOINTMENT_REMINDER: "Hello {{ customer_name }}\n\nThis is a reminder for your SmartQueue appointment at {{ branch_name }}.",
    NotificationEvent.QUEUE_COMPLETED: "Hello {{ customer_name }}\n\nYour queue visit for token {{ token }} is complete. Thank you for visiting {{ branch_name }}.",
    NotificationEvent.FEEDBACK_REQUEST: "Hello {{ customer_name }}\n\nPlease share feedback for your SmartQueue visit at {{ branch_name }}.",
}

DEFAULT_TEMPLATE_SUBJECTS = {
    NotificationEvent.QUEUE_JOINED: "SmartQueue token created",
    NotificationEvent.TOKEN_CALLED: "Your turn is ready",
    NotificationEvent.TOKEN_RECALLED: "Your token is being recalled",
    NotificationEvent.QUEUE_DELAYED: "Queue delay update",
    NotificationEvent.QUEUE_CANCELLED: "Queue cancelled",
    NotificationEvent.APPOINTMENT_REMINDER: "Appointment reminder",
    NotificationEvent.QUEUE_COMPLETED: "Queue completed",
    NotificationEvent.FEEDBACK_REQUEST: "We value your feedback",
}

EVENT_CHANNEL_MAP = {
    NotificationEvent.QUEUE_JOINED: [NotificationChannel.SMS, NotificationChannel.WHATSAPP, NotificationChannel.IN_APP],
    NotificationEvent.TOKEN_CALLED: [NotificationChannel.SMS, NotificationChannel.WHATSAPP, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    NotificationEvent.TOKEN_RECALLED: [NotificationChannel.SMS, NotificationChannel.WHATSAPP, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    NotificationEvent.QUEUE_DELAYED: [NotificationChannel.SMS, NotificationChannel.WHATSAPP, NotificationChannel.IN_APP],
    NotificationEvent.QUEUE_CANCELLED: [NotificationChannel.SMS, NotificationChannel.WHATSAPP, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    NotificationEvent.APPOINTMENT_REMINDER: [NotificationChannel.SMS, NotificationChannel.WHATSAPP, NotificationChannel.EMAIL],
    NotificationEvent.QUEUE_COMPLETED: [NotificationChannel.SMS, NotificationChannel.EMAIL, NotificationChannel.IN_APP],
    NotificationEvent.FEEDBACK_REQUEST: [NotificationChannel.SMS, NotificationChannel.WHATSAPP, NotificationChannel.EMAIL],
}


@dataclass
class DeliverySummary:
    notification_id: int
    channel: str
    status: str
    provider: str


def template_context(token: QueueToken, extra_context: dict | None = None):
    context = {
        "customer_name": token.customer_name,
        "token": token.token_number,
        "branch_name": token.branch.name,
        "counter": token.counter.name if token.counter_id else "TBD",
        "service_name": token.service.name,
        "status": token.status,
        "estimated_wait_minutes": "",
    }
    if extra_context:
        context.update(extra_context)
    return context


def get_or_create_template(event_type: str, channel: str):
    template = NotificationTemplate.objects.filter(event_type=event_type, channel=channel, is_active=True).first()
    if template:
        return template

    return NotificationTemplate.objects.create(
        name=f"{event_type.replace('_', ' ').title()} {channel.upper()}",
        event_type=event_type,
        channel=channel,
        subject=DEFAULT_TEMPLATE_SUBJECTS.get(event_type, ""),
        body=DEFAULT_TEMPLATE_BODIES.get(event_type, "Hello {{ customer_name }}"),
        is_active=True,
    )


def render_template(template: NotificationTemplate, context: dict):
    rendered_subject = Template(template.subject or "").render(Context(context)).strip()
    rendered_body = Template(template.body).render(Context(context)).strip()
    return rendered_subject, rendered_body


def default_destination(channel: str, token: QueueToken):
    if channel in {NotificationChannel.SMS, NotificationChannel.WHATSAPP}:
        return token.mobile_number
    if channel == NotificationChannel.EMAIL:
        return token.note if "@" in token.note else ""
    return ""


def create_log(notification: Notification, *, status: str, provider: str, request_payload: dict, response_payload: dict, error_message: str = ""):
    return NotificationLog.objects.create(
        notification=notification,
        status=status,
        provider=provider,
        request_payload=request_payload,
        response_payload=response_payload,
        error_message=error_message,
    )


def dispatch_notification(notification: Notification):
    adapter = PROVIDER_REGISTRY[notification.channel]
    notification.status = NotificationStatus.PROCESSING
    notification.provider = adapter.provider_name
    notification.save(update_fields=["status", "provider", "updated_at"])

    request_payload = {
        "destination": notification.destination,
        "title": notification.title,
        "message": notification.message,
        "metadata": notification.metadata,
    }
    result = adapter.send(
        destination=notification.destination,
        title=notification.title,
        message=notification.message,
        metadata=notification.metadata,
    )

    notification.provider = result.provider
    if result.status == NotificationStatus.FAILED:
        notification.retry_count += 1
        notification.status = NotificationStatus.FAILED
    else:
        notification.status = NotificationStatus.DELIVERED if notification.channel == NotificationChannel.IN_APP else NotificationStatus.SENT
        notification.sent_at = timezone.now()
        if notification.status == NotificationStatus.DELIVERED:
            notification.delivered_at = timezone.now()
    notification.save()

    create_log(
        notification,
        status=notification.status,
        provider=result.provider,
        request_payload=request_payload,
        response_payload=result.response_payload,
        error_message=result.error_message,
    )
    broadcast_notification_event(notification)
    return notification


def deliver_notification(notification: Notification):
    if notification.status == NotificationStatus.READ:
        return notification
    if notification.retry_count >= notification.max_retries and notification.status == NotificationStatus.FAILED:
        return notification
    return dispatch_notification(notification)


def in_app_recipients(token: QueueToken, actor: User | None = None):
    recipients = User.objects.filter(branch_id=token.branch_id, is_active=True).filter(
        role__in=[
            UserRole.ORGANIZATION_ADMIN,
            UserRole.BRANCH_MANAGER,
            UserRole.STAFF,
            UserRole.RECEPTIONIST,
        ]
    )
    if actor and actor.is_authenticated:
        recipients = recipients | User.objects.filter(id=actor.id)
    return recipients.distinct()


def create_notification_instance(
    *,
    token: QueueToken,
    event_type: str,
    channel: str,
    context: dict,
    recipient_user: User | None = None,
    destination: str = "",
):
    template = get_or_create_template(event_type, channel)
    subject, body = render_template(template, context)
    return Notification.objects.create(
        organization=token.organization,
        branch=token.branch,
        queue_token=token,
        template=template,
        recipient_user=recipient_user,
        channel=channel,
        event_type=event_type,
        title=subject,
        message=body,
        destination=destination,
        metadata={
            "token_number": token.token_number,
            "branch_name": token.branch.name,
            "counter_name": token.counter.name if token.counter_id else "",
            "recipient_user_id": recipient_user.id if recipient_user else None,
        },
    )


def notify_queue_event(event_type: str, token: QueueToken, actor: User | None = None, extra_context: dict | None = None):
    context = template_context(token, extra_context)
    created: list[DeliverySummary] = []

    for channel in EVENT_CHANNEL_MAP.get(event_type, [NotificationChannel.IN_APP]):
        if channel == NotificationChannel.IN_APP:
            for recipient in in_app_recipients(token, actor):
                notification = create_notification_instance(
                    token=token,
                    event_type=event_type,
                    channel=channel,
                    context=context,
                    recipient_user=recipient,
                )
                from .tasks import send_notification_task
                # Send as background task
                send_notification_task.delay(notification.id)
                created.append(
                    DeliverySummary(
                        notification_id=notification.id,
                        channel=notification.channel,
                        status=notification.status,
                        provider="queued",
                    )
                )
        else:
            notification = create_notification_instance(
                token=token,
                event_type=event_type,
                channel=channel,
                context=context,
                destination=default_destination(channel, token),
            )
            from .tasks import send_notification_task
            # Send as background task
            send_notification_task.delay(notification.id)
            created.append(
                DeliverySummary(
                    notification_id=notification.id,
                    channel=notification.channel,
                    status=notification.status,
                    provider="queued",
                )
            )

    return created


def retry_failed_notification(notification: Notification):
    if notification.status != NotificationStatus.FAILED:
        return notification
    if notification.retry_count >= notification.max_retries:
        return notification
    return deliver_notification(notification)


def provider_overview():
    items = []
    for channel, adapter in PROVIDER_REGISTRY.items():
        items.append(
            {
                "channel": channel,
                "provider": adapter.provider_name,
                "enabled": adapter.enabled(),
                "missing_credentials": adapter.missing_credentials(),
            }
        )
    return items


def notification_statistics(organization_id: int | None = None, branch_id: int | None = None):
    queryset = Notification.objects.all()
    if organization_id:
        queryset = queryset.filter(organization_id=organization_id)
    if branch_id:
        queryset = queryset.filter(branch_id=branch_id)

    aggregates = queryset.aggregate(
        total=Count("id"),
        unread=Count("id", filter=Q(status__in=[NotificationStatus.SENT, NotificationStatus.DELIVERED])),
        failed=Count("id", filter=Q(status=NotificationStatus.FAILED)),
        delivered=Count("id", filter=Q(status__in=[NotificationStatus.DELIVERED, NotificationStatus.READ])),
    )
    return {
        "total": aggregates["total"],
        "unread": aggregates["unread"],
        "failed": aggregates["failed"],
        "delivered": aggregates["delivered"],
        "providers": provider_overview(),
    }