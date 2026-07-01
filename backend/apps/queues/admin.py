from django.contrib import admin

from .models import QueueToken


@admin.register(QueueToken)
class QueueTokenAdmin(admin.ModelAdmin):
    list_display = ("token_number", "customer_name", "branch", "service", "counter", "status", "queue_date")
    list_filter = ("status", "organization", "branch", "service", "counter", "queue_date")
    search_fields = ("token_number", "customer_name", "mobile_number")

