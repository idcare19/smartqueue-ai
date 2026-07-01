from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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

