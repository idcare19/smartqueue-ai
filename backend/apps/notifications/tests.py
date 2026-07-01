from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta

from apps.organizations.models import Branch, Counter, Organization, Service
from apps.queues.models import QueueToken

from .models import Notification, NotificationChannel, NotificationEvent, NotificationStatus, NotificationTemplate
from .services import notify_queue_event
from .tasks import send_notification_task, cleanup_old_notifications_task, retry_failed_notification_task

User = get_user_model()


class NotificationFlowTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="SmartQueue", slug="smartqueue")
        self.manager = User.objects.create_user(
            username="manager",
            email="manager@smartqueue.ai",
            password="SecurePass123",
            role="branch_manager",
            organization=self.organization,
        )
        self.branch = Branch.objects.create(
            organization=self.organization,
            name="North Wing",
            slug="north-wing",
            manager=self.manager,
            queue_prefix="N",
        )
        self.manager.branch = self.branch
        self.manager.save(update_fields=["branch"])
        self.staff = User.objects.create_user(
            username="staff",
            email="staff@smartqueue.ai",
            password="SecurePass123",
            role="staff",
            organization=self.organization,
            branch=self.branch,
        )
        self.service = Service.objects.create(
            organization=self.organization,
            branch=self.branch,
            name="Consultation",
            duration_minutes=6,
            queue_prefix="C",
        )
        self.counter = Counter.objects.create(
            organization=self.organization,
            branch=self.branch,
            name="Counter 01",
        )
        self.token = QueueToken.objects.create(
            organization=self.organization,
            branch=self.branch,
            service=self.service,
            counter=self.counter,
            customer_name="Ava",
            mobile_number="9999999999",
            token_number="C-001",
            sequence_number=1,
            note="ava@example.com",
        )
        refresh = RefreshToken.for_user(self.manager)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_notify_queue_event_creates_notifications_and_templates(self):
        deliveries = notify_queue_event(NotificationEvent.TOKEN_CALLED, self.token, actor=self.manager)
        self.assertGreaterEqual(len(deliveries), 4)
        self.assertTrue(Notification.objects.filter(queue_token=self.token, channel=NotificationChannel.SMS).exists())
        self.assertTrue(NotificationTemplate.objects.filter(event_type=NotificationEvent.TOKEN_CALLED).exists())

    def test_notifications_api_read_and_stats(self):
        notify_queue_event(NotificationEvent.QUEUE_JOINED, self.token, actor=self.manager)
        list_response = self.client.get(reverse("notification-list"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(list_response.data["count"], 1)

        notification_id = list_response.data["results"][0]["id"]
        read_response = self.client.post(reverse("notification-mark-read", args=[notification_id]))
        self.assertEqual(read_response.status_code, status.HTTP_200_OK)
        self.assertEqual(read_response.data["status"], NotificationStatus.READ)

        stats_response = self.client.get(reverse("notification-stats"))
        self.assertEqual(stats_response.status_code, status.HTTP_200_OK)
        self.assertIn("providers", stats_response.data)

    def test_customer_history_endpoint(self):
        notify_queue_event(NotificationEvent.TOKEN_RECALLED, self.token, actor=self.manager)
        response = self.client.get(
            reverse("notification-customer-history"),
            {"token": self.token.token_number, "mobile": self.token.mobile_number},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_send_notification_task_eager_mode(self):
        """Test that notification tasks work in eager mode (synchronous execution)"""
        from django.conf import settings
        self.assertTrue(settings.CELERY_TASK_ALWAYS_EAGER)
        
        # Create a test notification
        notification = Notification.objects.create(
            organization=self.organization,
            branch=self.branch,
            recipient_user=self.manager,
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEvent.QUEUE_JOINED,
            queue_token=self.token,
            status=NotificationStatus.PENDING,
            message="Test notification",
            title="Test"
        )
        
        # Execute the task synchronously
        result = send_notification_task.delay(notification.id)
        # In eager mode, it executes immediately and returns a result
        self.assertTrue(result.successful())

    def test_cleanup_old_notifications_task(self):
        """Test that old notifications are marked as expired"""
        # Create an old notification (100 days old)
        old_notification = Notification.objects.create(
            organization=self.organization,
            branch=self.branch,
            recipient_user=self.manager,
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEvent.QUEUE_JOINED,
            queue_token=self.token,
            status=NotificationStatus.SENT,
            created_at=timezone.now() - timedelta(days=100),
            message="Test old notification",
            title="Old Test"
        )
        
        # Create a recent notification (10 days old)
        recent_notification = Notification.objects.create(
            organization=self.organization,
            branch=self.branch,
            recipient_user=self.manager,
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEvent.QUEUE_JOINED,
            queue_token=self.token,
            status=NotificationStatus.SENT,
            created_at=timezone.now() - timedelta(days=10),
            message="Test recent notification",
            title="Recent Test"
        )
        
        # Manually update created_at to be 100 days ago (since auto_now_add=True overrides constructor value)
        old_notification.created_at = timezone.now() - timedelta(days=100)
        old_notification.save(update_fields=['created_at'])
        # Run cleanup with 90 day threshold
        result = cleanup_old_notifications_task.delay(days_old=90)
        self.assertTrue(result.successful())
        
        # Refresh from database
        old_notification.refresh_from_db()
        recent_notification.refresh_from_db()
        
        # Old notification should be expired
        self.assertEqual(old_notification.status, NotificationStatus.EXPIRED)
        # Recent notification should still be sent
        self.assertEqual(recent_notification.status, NotificationStatus.SENT)

    def test_retry_failed_notification_task(self):
        """Test that failed notifications can be retried"""
        # Create a failed notification
        failed_notification = Notification.objects.create(
            organization=self.organization,
            branch=self.branch,
            recipient_user=self.manager,
            channel=NotificationChannel.IN_APP,
            event_type=NotificationEvent.QUEUE_JOINED,
            queue_token=self.token,
            status=NotificationStatus.FAILED,
            failure_reason="Test failure",
            retry_count=0,
            created_at=timezone.now(),
            message="Test failed notification",
            title="Failed Test"
        )
        
        # Execute retry task
        result = retry_failed_notification_task.delay(failed_notification.id)
        self.assertTrue(result.successful())
        
        # Refresh from database
        failed_notification.refresh_from_db()
        # It should now be delivered after successful retry (IN_APP channel gets marked as delivered)
        failed_notification.refresh_from_db()
        self.assertEqual(failed_notification.status, NotificationStatus.DELIVERED)