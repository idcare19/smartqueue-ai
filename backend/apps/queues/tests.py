from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.organizations.models import Branch, Counter, Organization, Service
from apps.queues.models import QueueToken

User = get_user_model()


class QueueEngineTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="SmartQueue Health", slug="smartqueue-health")
        self.manager = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="SecurePass123",
            role="branch_manager",
            organization=self.organization,
        )
        self.branch = Branch.objects.create(
            organization=self.organization,
            name="North Wing",
            slug="north-wing",
            manager=self.manager,
            queue_prefix="A",
        )
        self.manager.branch = self.branch
        self.manager.save(update_fields=["branch"])
        self.service = Service.objects.create(
            organization=self.organization,
            branch=self.branch,
            name="Consultation",
            duration_minutes=7,
            queue_prefix="C",
            priority=1,
        )
        self.counter = Counter.objects.create(
            organization=self.organization,
            branch=self.branch,
            name="Counter 01",
        )
        self.counter.assigned_staff.add(self.manager)

    def authenticate(self):
        refresh = RefreshToken.for_user(self.manager)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_join_and_queue_lifecycle(self):
        join_response = self.client.post(
            reverse("queue-token-join-queue"),
            {
                "branch": self.branch.id,
                "service": self.service.id,
                "customer_name": "Ava Johnson",
                "mobile_number": "9999999999",
            },
            format="json",
        )
        self.assertEqual(join_response.status_code, status.HTTP_201_CREATED)
        token_id = join_response.data["id"]
        self.assertEqual(join_response.data["token_number"], "C-001")
        self.assertEqual(join_response.data["status"], "waiting")

        self.authenticate()

        call_next_response = self.client.post(
            reverse("queue-token-call-next"),
            {"counter": self.counter.id, "branch": self.branch.id},
            format="json",
        )
        self.assertEqual(call_next_response.status_code, status.HTTP_200_OK)
        self.assertEqual(call_next_response.data["status"], "called")

        serving_response = self.client.post(reverse("queue-token-mark-serving", args=[token_id]), format="json")
        self.assertEqual(serving_response.status_code, status.HTTP_200_OK)
        self.assertEqual(serving_response.data["status"], "serving")

        complete_response = self.client.post(reverse("queue-token-complete", args=[token_id]), format="json")
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["status"], "completed")

    def test_public_and_customer_status(self):
        token = QueueToken.objects.create(
            organization=self.organization,
            branch=self.branch,
            service=self.service,
            customer_name="Liam",
            mobile_number="8888888888",
            token_number="C-001",
            sequence_number=1,
        )
        public_response = self.client.get(reverse("queue-token-public-status"), {"branch": self.branch.id})
        self.assertEqual(public_response.status_code, status.HTTP_200_OK)
        self.assertEqual(public_response.data[0]["token_number"], token.token_number)

        customer_response = self.client.get(
            reverse("queue-token-customer-status"),
            {"token": token.token_number, "mobile": token.mobile_number},
        )
        self.assertEqual(customer_response.status_code, status.HTTP_200_OK)
        self.assertEqual(customer_response.data["token_number"], token.token_number)

