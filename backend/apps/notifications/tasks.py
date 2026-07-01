import logging
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from celery import shared_task
from celery.utils.log import get_task_logger

from .models import Notification, NotificationStatus, NotificationLog
from .services import dispatch_notification, retry_failed_notification as service_retry_failed

logger = get_task_logger(__name__)
MAX_RETRIES = 5


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_notification_task(self, notification_id: int):
    """Send a notification as a background task"""
    try:
        notification = Notification.objects.get(id=notification_id)
        logger.info(f"Processing notification {notification_id} for channel {notification.channel}")
        
        with transaction.atomic():
            result = dispatch_notification(notification)
            logger.info(f"Notification {notification_id} processed with status: {result.status}")
            
            # If it failed and we haven't exceeded max retries, schedule a retry
            if result.status == NotificationStatus.FAILED and notification.retry_count < notification.max_retries:
                # Calculate exponential backoff
                retry_delay = 60 * (2 ** notification.retry_count)  # 60s, 120s, 240s...
                next_retry = timezone.now() + timedelta(seconds=retry_delay)
                notification.next_retry_at = next_retry
                notification.save(update_fields=['next_retry_at', 'updated_at'])
                
                logger.warning(f"Notification {notification_id} failed, scheduling retry at {next_retry}")
                retry_failed_notification_task.apply_async(args=[notification_id], eta=next_retry)
                
            return result.status
            
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return "failed_not_found"
    except Exception as exc:
        logger.error(f"Error processing notification {notification_id}: {str(exc)}", exc_info=True)
        self.retry(exc=exc)


@shared_task(bind=True)
def retry_failed_notification_task(self, notification_id: int):
    """Retry a failed notification"""
    try:
        notification = Notification.objects.get(id=notification_id)
        if notification.status != NotificationStatus.FAILED:
            logger.info(f"Notification {notification_id} is not in failed state, skipping retry")
            return "skipped"
            
        if notification.retry_count >= notification.max_retries:
            logger.warning(f"Notification {notification_id} has exceeded max retries, marking as expired")
            notification.status = "expired"
            notification.save(update_fields=['status', 'updated_at'])
            
            # Log the expiration
            NotificationLog.objects.create(
                notification=notification,
                status="expired",
                provider=notification.provider,
                error_message="Max retry attempts exceeded",
                attempted_at=timezone.now()
            )
            return "expired"
            
        logger.info(f"Retrying failed notification {notification_id} (attempt {notification.retry_count + 1}/{notification.max_retries})")
        result = service_retry_failed(notification)
        return f"retry_attempted: {result.status}"
        
    except Notification.DoesNotExist:
        logger.error(f"Notification {notification_id} not found")
        return "failed_not_found"
    except Exception as exc:
        logger.error(f"Error retrying notification {notification_id}: {str(exc)}", exc_info=True)
        return f"retry_failed: {str(exc)}"


@shared_task
def bulk_send_notifications_task(notification_ids: list[int]):
    """Send multiple notifications in bulk"""
    results = []
    for notification_id in notification_ids:
        result = send_notification_task.delay(notification_id)
        results.append({"notification_id": notification_id, "task_id": result.id})
    
    logger.info(f"Bulk send initiated for {len(results)} notifications")
    return results


@shared_task
def cleanup_old_notifications_task(days_old: int = 90):
    """Clean up notifications older than the specified number of days - mark as expired"""
    cutoff_date = timezone.now() - timedelta(days=days_old)
    old_notifications = Notification.objects.filter(
        created_at__lt=cutoff_date
    ).exclude(status__in=[NotificationStatus.EXPIRED])
    
    count = 0
    for notification in old_notifications:
        notification.status = NotificationStatus.EXPIRED
        notification.failure_reason = f"Notification expired after {days_old} days"
        notification.save(update_fields=['status', 'failure_reason', 'updated_at'])
        count += 1
    
    logger.info(f"Cleanup complete. Marked {count} notifications as expired (older than {days_old} days)")
    
    return f"Marked {count} notifications as expired"


@shared_task
def retry_all_failed_notifications():
    """Scheduled task to retry all failed notifications that are eligible for retry"""
    failed_notifications = Notification.objects.filter(
        status=NotificationStatus.FAILED,
        retry_count__lt=models.F('max_retries'),
        next_retry_at__lte=timezone.now()
    )
    
    count = 0
    for notification in failed_notifications:
        retry_failed_notification_task.delay(notification.id)
        count += 1
    
    logger.info(f"Scheduled retry for {count} failed notifications")
    
    return f"Queued {count} failed notifications for retry"


@shared_task
def cleanup_old_logs_task(days_old: int = 30):
    """Clean up notification logs older than the specified number of days"""
    cutoff_date = timezone.now() - timedelta(days=days_old)
    old_logs = NotificationLog.objects.filter(attempted_at__lt=cutoff_date)
    count = old_logs.count()
    
    batch_size = 1000
    deleted = 0
    while old_logs.exists():
        batch = list(old_logs.values_list('id', flat=True)[:batch_size])
        NotificationLog.objects.filter(id__in=batch).delete()
        deleted += len(batch)
    
    logger.info(f"Log cleanup complete. Deleted {deleted} logs older than {days_old} days")
    
    # Add audit logging
    from apps.core.models import create_audit_log, AuditActionType
    create_audit_log(
        action_type=AuditActionType.SCHEDULED_TASK_EXECUTED,
        description=f"Deleted {deleted} old notification logs",
        metadata={"deleted_count": deleted, "days_old": days_old, "task": "cleanup_old_logs"}
    )
    
    return f"Deleted {deleted} old logs"


@shared_task
def generate_analytics_snapshots_task():
    """Generate hourly analytics snapshots"""
    from apps.analytics.services import generate_snapshots
    try:
        results = generate_snapshots()
        logger.info(f"Analytics snapshots generated successfully: {results}")
        
        # Add audit logging
        from apps.core.models import create_audit_log, AuditActionType
        create_audit_log(
            action_type=AuditActionType.SCHEDULED_TASK_EXECUTED,
            description="Generated analytics snapshots successfully",
            metadata={"results": results, "task": "generate_analytics_snapshots"}
        )
        
        return results
    except Exception as exc:
        logger.error(f"Failed to generate analytics snapshots: {str(exc)}", exc_info=True)
        
        # Log failure to audit log
        from apps.core.models import create_audit_log, AuditActionType
        create_audit_log(
            action_type=AuditActionType.SCHEDULED_TASK_FAILED,
            description=f"Failed to generate analytics snapshots: {str(exc)}",
            metadata={"error": str(exc), "task": "generate_analytics_snapshots"}
        )
        
        return f"failed: {str(exc)}"


@shared_task
def queue_health_summary_task():
    """Generate queue health summary every 15 minutes"""
    from apps.queues.services import get_system_health
    try:
        health = get_system_health()
        logger.info(f"Queue health summary generated: {health}")
        
        # Add audit logging
        from apps.core.models import create_audit_log, AuditActionType
        create_audit_log(
            action_type=AuditActionType.SCHEDULED_TASK_EXECUTED,
            description="Generated queue health summary",
            metadata={"health": health, "task": "queue_health_summary"}
        )
        
        return health
    except Exception as exc:
        logger.error(f"Failed to generate queue health summary: {str(exc)}", exc_info=True)
        
        # Log failure to audit log
        from apps.core.models import create_audit_log, AuditActionType
        create_audit_log(
            action_type=AuditActionType.SCHEDULED_TASK_FAILED,
            description=f"Failed to generate queue health summary: {str(exc)}",
            metadata={"error": str(exc), "task": "queue_health_summary"}
        )
        
        return f"failed: {str(exc)}"