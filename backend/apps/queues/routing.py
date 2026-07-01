from django.urls import re_path

from .consumers import QueueConsumer

websocket_urlpatterns = [
    re_path(r"ws/queue/(?P<stream>organization|branch|counter|staff|public|customer)/(?P<identifier>[^/]*)/$", QueueConsumer.as_asgi()),
]

