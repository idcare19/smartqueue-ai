from django.urls import path
from .views import (
    OverallHealthView,
    DatabaseHealthView,
    RedisHealthView,
    CeleryHealthView,
    WebSocketHealthView
)

urlpatterns = [
    path('health/', OverallHealthView.as_view(), name='health-overall'),
    path('health/db/', DatabaseHealthView.as_view(), name='health-database'),
    path('health/redis/', RedisHealthView.as_view(), name='health-redis'),
    path('health/celery/', CeleryHealthView.as_view(), name='health-celery'),
    path('health/websocket/', WebSocketHealthView.as_view(), name='health-websocket'),
]