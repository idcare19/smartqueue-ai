from rest_framework.routers import DefaultRouter

from .views import QueueTokenViewSet

router = DefaultRouter()
router.register("queue-tokens", QueueTokenViewSet, basename="queue-token")

urlpatterns = router.urls

