from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.organizations.models import Branch, Organization, Service

User = get_user_model()


class OrganizationCrudTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Queue Org", slug="queue-org")
        self.admin_user = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="SecurePass123",
            role="organization_admin",
            organization=self.organization,
        )
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_branch_and_service_crud(self):
        branch_response = self.client.post(
            reverse("branch-list"),
            {
                "organization": self.organization.id,
                "name": "Front Desk",
                "slug": "front-desk",
                "status": "active",
                "working_hours": "9 AM - 5 PM",
                "queue_prefix": "F",
                "manager": self.admin_user.id,
            },
            format="json",
        )
        self.assertEqual(branch_response.status_code, status.HTTP_201_CREATED)
        branch = Branch.objects.get(id=branch_response.data["id"])

        service_response = self.client.post(
            reverse("service-list"),
            {
                "organization": self.organization.id,
                "branch": branch.id,
                "name": "Billing",
                "duration": 5,
                "prefix": "B",
                "priority": 1,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(service_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Service.objects.filter(branch=branch, name="Billing").exists())

