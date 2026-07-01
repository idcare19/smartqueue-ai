from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.organizations.models import Branch, Counter, Organization, Service
from apps.queues.models import QueueToken

from .models import PredictionSnapshot
from .services import analytics_summary, create_prediction_snapshot, estimate_wait_time

User = get_user_model()


class AnalyticsPredictionTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="SmartQueue AI", slug="smartqueue-ai")
        self.manager = User.objects.create_user(
            username="manager",
            email="manager@smartqueue.ai",
            password="SecurePass123",
            role="branch_manager",
            organization=self.organization,
        )
        self.branch = Branch.objects.create(
            organization=self.organization,
            name="Main Branch",
            slug="main-branch",
            manager=self.manager,
            queue_prefix="M",
        )
        self.manager.branch = self.branch
        self.manager.save(update_fields=["branch"])
        self.service = Service.objects.create(
            organization=self.organization,
            branch=self.branch,
            name="General Consultation",
            duration_minutes=8,
            queue_prefix="G",
        )
        self.counter = Counter.objects.create(
            organization=self.organization,
            branch=self.branch,
            name="Counter 01",
            status=Counter.CounterStatus.OPEN,
        )
        self.counter.assigned_staff.add(self.manager)

    def authenticate(self):
        refresh = RefreshToken.for_user(self.manager)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def _create_completed_token(self, sequence: int, created_at, called_delay=5, serving_delay=7, service_duration=6):
        token = QueueToken.objects.create(
            organization=self.organization,
            branch=self.branch,
            service=self.service,
            counter=self.counter,
            customer_name=f"Customer {sequence}",
            mobile_number=f"99999999{sequence:02d}",
            token_number=f"G-{sequence:03d}",
            sequence_number=sequence,
            status=QueueToken.QueueStatus.COMPLETED,
            queue_date=timezone.localdate(),
            called_at=created_at + timedelta(minutes=called_delay),
            serving_at=created_at + timedelta(minutes=serving_delay),
            completed_at=created_at + timedelta(minutes=serving_delay + service_duration),
        )
        QueueToken.objects.filter(pk=token.pk).update(created_at=created_at)
        token.refresh_from_db()
        return token

    def test_estimate_wait_time_and_snapshot(self):
        QueueToken.objects.create(
            organization=self.organization,
            branch=self.branch,
            service=self.service,
            customer_name="Waiting One",
            mobile_number="9999999001",
            token_number="G-001",
            sequence_number=1,
            status=QueueToken.QueueStatus.WAITING,
        )
        QueueToken.objects.create(
            organization=self.organization,
            branch=self.branch,
            service=self.service,
            customer_name="Waiting Two",
            mobile_number="9999999002",
            token_number="G-002",
            sequence_number=2,
            status=QueueToken.QueueStatus.WAITING,
        )

        base_time = timezone.now() - timedelta(hours=2)
        for index in range(3, 11):
            self._create_completed_token(index, base_time + timedelta(minutes=index * 10), service_duration=6)

        prediction = estimate_wait_time(self.branch, self.service)
        self.assertEqual(prediction.estimated_wait_minutes, 12)
        self.assertEqual(prediction.confidence, PredictionSnapshot.ConfidenceLevel.MEDIUM)

        snapshot = create_prediction_snapshot(self.branch, self.service)
        self.assertEqual(snapshot.estimated_wait_minutes, 12)
        self.assertEqual(PredictionSnapshot.objects.count(), 1)

    def test_analytics_summary_endpoint(self):
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        self._create_completed_token(1, now - timedelta(hours=3), called_delay=4, serving_delay=6, service_duration=5)
        self._create_completed_token(2, now - timedelta(hours=2), called_delay=6, serving_delay=8, service_duration=7)
        QueueToken.objects.create(
            organization=self.organization,
            branch=self.branch,
            service=self.service,
            customer_name="No Show",
            mobile_number="9999999011",
            token_number="G-011",
            sequence_number=11,
            status=QueueToken.QueueStatus.NO_SHOW,
            queue_date=timezone.localdate(),
        )
        QueueToken.objects.create(
            organization=self.organization,
            branch=self.branch,
            service=self.service,
            customer_name="Waiting",
            mobile_number="9999999012",
            token_number="G-012",
            sequence_number=12,
            status=QueueToken.QueueStatus.WAITING,
            queue_date=timezone.localdate(),
        )

        summary = analytics_summary(branch=self.branch, organization_id=self.organization.id)
        self.assertEqual(summary["average_wait_time_minutes"], 5)
        self.assertEqual(summary["average_service_time_minutes"], 6)
        self.assertEqual(summary["completed_tokens"], 2)
        self.assertEqual(summary["no_show_rate"], 25.0)
        self.assertTrue(summary["prediction"])
        self.assertIn("No-show rate increased today", summary["insights"])

        self.authenticate()
        response = self.client.get(reverse("analytics-summary"), {"branch": self.branch.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["completed_tokens"], 2)
        self.assertEqual(response.data["average_wait_time_minutes"], 5)
