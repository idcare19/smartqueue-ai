from rest_framework import serializers


class AnalyticsSummarySerializer(serializers.Serializer):
    average_wait_time_minutes = serializers.IntegerField()
    average_service_time_minutes = serializers.IntegerField()
    peak_hours = serializers.ListField()
    no_show_rate = serializers.FloatField()
    completed_tokens = serializers.IntegerField()
    queue_load_by_service = serializers.ListField()
    counter_performance = serializers.ListField()
    insights = serializers.ListField()
    prediction = serializers.DictField(allow_null=True)

