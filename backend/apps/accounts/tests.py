from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.organizations.models import Organization

User = get_user_model()


class AuthFlowTests(APITestCase):
    def test_register_login_and_me_flow(self):
        register_payload = {
            "email": "Owner@Example.com",
            "password": "SecurePass123",
            "full_name": "Queue Owner",
            "organization_name": "SmartQueue Clinic",
            "phone_number": "9999999999",
            "role": "organization_admin",
        }

        register_response = self.client.post(reverse("auth-register"), register_payload, format="json")
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", register_response.data)
        self.assertEqual(register_response.data["user"]["email"], "owner@example.com")

        created_user = User.objects.get(email="owner@example.com")
        self.assertTrue(created_user.check_password("SecurePass123"))
        self.assertFalse(created_user.is_active)

        uid = urlsafe_base64_encode(force_bytes(created_user.pk))
        token = default_token_generator.make_token(created_user)
        verify_response = self.client.post(reverse("auth-verify-email"), {"uid": uid, "token": token}, format="json")
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)

        created_user.refresh_from_db()
        self.assertTrue(created_user.is_active)

        login_response = self.client.post(
            reverse("auth-login"),
            {"email": "owner@example.com", "password": "SecurePass123"},
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_response.data["access"]}')
        me_response = self.client.get(reverse("auth-me"))
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["email"], "owner@example.com")
        self.assertEqual(me_response.data["role"], "organization_admin")


class StaffManagementTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Queue Org", slug="queue-org-staff")
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="SecurePass123",
            role="super_admin",
            organization=self.organization,
        )
        refresh = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        self.staff = User.objects.create_user(
            username="staff",
            email="staff@example.com",
            password="SecurePass123",
            role="staff",
            organization=self.organization,
        )

    def test_staff_archive_restore_and_presence(self):
        archive_response = self.client.post(reverse("staff-archive", args=[self.staff.id]), format="json")
        self.assertEqual(archive_response.status_code, status.HTTP_200_OK)
        restore_response = self.client.post(reverse("staff-restore", args=[self.staff.id]), format="json")
        self.assertEqual(restore_response.status_code, status.HTTP_200_OK)
        offline_response = self.client.post(reverse("staff-offline", args=[self.staff.id]), format="json")
        self.assertEqual(offline_response.status_code, status.HTTP_200_OK)
        online_response = self.client.post(reverse("staff-online", args=[self.staff.id]), format="json")
        self.assertEqual(online_response.status_code, status.HTTP_200_OK)

    def test_admin_can_list_staff(self):
        response = self.client.get(reverse("staff-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
