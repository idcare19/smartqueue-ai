from django.contrib import admin

from .models import PredictionSnapshot


@admin.register(PredictionSnapshot)
class PredictionSnapshotAdmin(admin.ModelAdmin):
    list_display = ("branch", "service", "estimated_wait_minutes", "confidence", "queue_length", "created_at")
    list_filter = ("confidence", "organization", "branch")
    search_fields = ("branch__name", "service__name", "organization__name")

