from django.contrib.auth import get_user_model
from django.urls import clear_url_caches, resolve, reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.organizations.models import Organization

User = get_user_model()


class ReportExportTests(APITestCase):
    def setUp(self):
        clear_url_caches()
        self.organization = Organization.objects.create(name="Export Org", slug="export-org")
        self.user = User.objects.create_user(
            username="exporter",
            email="exporter@example.com",
            password="SecurePass123",
            role="super_admin",
            organization=self.organization,
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        self.export_path = reverse("report-export")
        self.resolved = resolve(self.export_path)

    def test_csv_export(self):
        self.assertEqual(self.export_path, "/api/reports/export/")
        self.assertEqual(self.resolved.url_name, "report-export")
        response = self.client.get(f"{self.export_path}?format=csv&type=queue")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "text/csv")

    def test_pdf_export(self):
        response = self.client.get(f"{self.export_path}?format=pdf&type=analytics")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")

    def test_xlsx_export(self):
        response = self.client.get(f"{self.export_path}?format=xlsx&type=staff")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
