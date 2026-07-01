import json
from django.urls import clear_url_caches, reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.core.health import get_aggregate_health, check_database_health, check_redis_health, check_celery_health, check_websocket_health


class HealthCheckTests(APITestCase):
    def setUp(self):
        clear_url_caches()

    def test_health_endpoint_returns_200(self):
        """Test that the main health endpoint returns 200 even with degraded services"""
        response = self.client.get(reverse("health-overall"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Parse JSON response
        data = json.loads(response.content)
        # Should have all services in response
        self.assertIn("services", data)
        self.assertIn("database", data["services"])
        self.assertIn("redis", data["services"])
        self.assertIn("celery", data["services"])
        self.assertIn("websocket", data["services"])
        # Overall status shouldn't be unhealthy in dev even if Redis is down
        self.assertIn(data["status"], ["healthy", "degraded"])

    def test_db_health_endpoint(self):
        """Test that database health check always passes in test environment"""
        response = self.client.get(reverse("health-database"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertEqual(data["status"], "healthy")

    def test_redis_health_degraded_when_unavailable(self):
        """Test that Redis health returns degraded in dev when not running"""
        response = self.client.get(reverse("health-redis"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        # Should be either healthy (if Redis is running) or degraded (when not running in dev)
        self.assertIn(data["status"], ["healthy", "degraded"])

    def test_celery_health_in_eager_mode(self):
        """Test that Celery health reports healthy in eager mode"""
        from django.conf import settings
        self.assertTrue(settings.CELERY_TASK_ALWAYS_EAGER)
        
        response = self.client.get(reverse("health-celery"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["mode"], "eager")

    def test_websocket_health_with_in_memory_layer(self):
        """Test that WebSocket health is healthy with in-memory channel layer"""
        from django.conf import settings
        self.assertFalse(settings.USE_REDIS_CHANNELS)
        
        response = self.client.get(reverse("health-websocket"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["backend"], "in_memory")

    def test_aggregate_health_function(self):
        """Test that aggregate health doesn't crash even if some services are unavailable"""
        health_report = get_aggregate_health()
        # Should always complete without exceptions
        self.assertIn("status", health_report)
        self.assertIn("services", health_report)
        self.assertEqual(len(health_report["services"]), 4)  # db, redis, celery, websocket

    def test_version_and_info_endpoints(self):
        version_response = self.client.get(reverse("version"))
        info_response = self.client.get(reverse("app-info"))
        self.assertEqual(version_response.status_code, status.HTTP_200_OK)
        self.assertEqual(info_response.status_code, status.HTTP_200_OK)
        self.assertIn("version", json.loads(version_response.content))
        self.assertIn("name", json.loads(info_response.content))
