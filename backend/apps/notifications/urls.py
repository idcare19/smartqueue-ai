from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import NotificationLogViewSet, NotificationStatsView, NotificationTemplateViewSet, NotificationViewSet, ProviderOverviewView

router = DefaultRouter()
router.register("notifications", NotificationViewSet, basename="notification")
router.register("notification-templates", NotificationTemplateViewSet, basename="notification-template")
router.register("notification-logs", NotificationLogViewSet, basename="notification-log")

urlpatterns = router.urls + [
    path("notification-stats/", NotificationStatsView.as_view(), name="notification-stats"),
    path("notification-providers/", ProviderOverviewView.as_view(), name="notification-providers"),
]
