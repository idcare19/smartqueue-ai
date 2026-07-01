from django.urls import path

from .views import report_export_view

urlpatterns = [
    path("reports/export/", report_export_view, name="report-export"),
]
