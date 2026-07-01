from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.core.urls')),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.organizations.urls')),
    path('api/', include('apps.queues.urls')),
    path('api/', include('apps.analytics.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/', include('apps.reports.urls')),
]
