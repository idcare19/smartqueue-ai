from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
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

        delete_response = self.client.delete(reverse("branch-detail", args=[branch.id]))
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        branch.refresh_from_db()
        self.assertFalse(branch.is_active)

        restore_response = self.client.post(reverse("branch-restore", args=[branch.id]), format="json")
        self.assertEqual(restore_response.status_code, status.HTTP_200_OK)
        branch.refresh_from_db()
        self.assertTrue(branch.is_active)


class AdminDashboardCrudTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Admin Org", slug="admin-org")
        self.admin = User.objects.create_user(
            username="superadmin",
            email="superadmin@example.com",
            password="SecurePass123",
            role="super_admin",
            is_staff=True,
            is_superuser=True,
            organization=self.organization,
        )
        refresh = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        self.branch = Branch.objects.create(
            organization=self.organization,
            name="Main Branch",
            slug="main-branch",
            manager=self.admin,
            queue_prefix="M",
        )

    def test_admin_can_create_branch(self):
        response = self.client.post(
            reverse("branch-list"),
            {
                "organization": self.organization.id,
                "name": "Front Branch",
                "slug": "front-branch",
                "status": "active",
                "working_hours": "9 AM - 5 PM",
                "timezone": "UTC",
                "queue_prefix": "F",
                "manager": self.admin.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_can_create_service(self):
        response = self.client.post(
            reverse("service-list"),
            {
                "organization": self.organization.id,
                "branch": self.branch.id,
                "name": "Consultation",
                "duration": 10,
                "prefix": "C",
                "priority": 1,
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_can_create_counter(self):
        response = self.client.post(
            reverse("counter-list"),
            {
                "organization": self.organization.id,
                "branch": self.branch.id,
                "name": "Counter 1",
                "status": "open",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_logo_upload_validation(self):
        invalid_logo = SimpleUploadedFile("logo.txt", b"not-an-image", content_type="text/plain")
        response = self.client.post(
            reverse("organization-list"),
            {
                "name": "Logo Org",
                "slug": "logo-org",
                "logo": invalid_logo,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        branch = Branch.objects.create(
            organization=self.organization,
            name="Logo Branch",
            slug="logo-branch",
            manager=self.admin,
            queue_prefix="L",
        )
        branch_logo = SimpleUploadedFile("branch-logo.gif", b"fake-data", content_type="image/gif")
        branch_response = self.client.patch(
            reverse("branch-detail", args=[branch.id]),
            {"logo": branch_logo},
            format="multipart",
        )
        self.assertEqual(branch_response.status_code, status.HTTP_400_BAD_REQUEST)
