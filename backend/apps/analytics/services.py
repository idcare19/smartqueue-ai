from __future__ import annotations

from dataclasses import dataclass

from django.db.models import Avg, Count, F, ExpressionWrapper, DurationField
from django.db.models.functions import ExtractHour
from django.utils import timezone

from apps.organizations.models import Branch, Counter, Service
from apps.queues.models import QueueToken

from .models import PredictionSnapshot


@dataclass
class PredictionResult:
    estimated_wait_minutes: int
    confidence: str
    queue_length: int
    active_counters: int
    available_staff: int


def _completed_tokens_queryset(branch: Branch, service: Service | None = None):
    queryset = QueueToken.objects.filter(branch=branch, status=QueueToken.QueueStatus.COMPLETED).exclude(
        serving_at__isnull=True
    )
    if service:
        queryset = queryset.filter(service=service)
    return queryset


def estimate_wait_time(branch: Branch, service: Service | None = None) -> PredictionResult:
    active_statuses = [
        QueueToken.QueueStatus.WAITING,
        QueueToken.QueueStatus.CALLED,
        QueueToken.QueueStatus.SERVING,
    ]
    queue_queryset = QueueToken.objects.filter(branch=branch, status__in=active_statuses)
    if service:
        queue_queryset = queue_queryset.filter(service=service)

    queue_length = queue_queryset.count()
    active_counters = branch.counters.filter(status=Counter.CounterStatus.OPEN).count()
    available_staff = branch.users.filter(is_active=True, role__in=["branch_manager", "staff", "receptionist"]).count()

    completed_queryset = _completed_tokens_queryset(branch, service).annotate(
        service_duration=ExpressionWrapper(F("completed_at") - F("serving_at"), output_field=DurationField())
    )
    historical_count = completed_queryset.count()
    average_duration = completed_queryset.aggregate(avg=Avg("service_duration"))["avg"]

    if average_duration is None:
        default_minutes = service.duration_minutes if service else 6
        average_minutes = default_minutes
    else:
        average_minutes = max(int(average_duration.total_seconds() // 60), 1)

    throughput_divisor = max(active_counters, 1)
    staff_modifier = 1 if available_staff >= active_counters else 2
    estimated_wait_minutes = max(int((queue_length * average_minutes * staff_modifier) / throughput_divisor), 0)

    if historical_count >= 20 and active_counters >= 2:
        confidence = PredictionSnapshot.ConfidenceLevel.HIGH
    elif historical_count >= 8:
        confidence = PredictionSnapshot.ConfidenceLevel.MEDIUM
    else:
        confidence = PredictionSnapshot.ConfidenceLevel.LOW

    return PredictionResult(
        estimated_wait_minutes=estimated_wait_minutes,
        confidence=confidence,
        queue_length=queue_length,
        active_counters=active_counters,
        available_staff=available_staff,
    )


def create_prediction_snapshot(branch: Branch, service: Service | None = None) -> PredictionSnapshot:
    prediction = estimate_wait_time(branch, service)
    return PredictionSnapshot.objects.create(
        organization=branch.organization,
        branch=branch,
        service=service,
        queue_length=prediction.queue_length,
        active_counters=prediction.active_counters,
        available_staff=prediction.available_staff,
        estimated_wait_minutes=prediction.estimated_wait_minutes,
        confidence=prediction.confidence,
    )


def analytics_summary(branch: Branch | None = None, organization_id: int | None = None):
    queryset = QueueToken.objects.all()
    if organization_id:
        queryset = queryset.filter(organization_id=organization_id)
    if branch:
        queryset = queryset.filter(branch=branch)

    today = timezone.localdate()
    today_queryset = queryset.filter(queue_date=today)
    completed_queryset = today_queryset.filter(status=QueueToken.QueueStatus.COMPLETED).exclude(serving_at__isnull=True)
    called_queryset = today_queryset.filter(status__in=[QueueToken.QueueStatus.CALLED, QueueToken.QueueStatus.SERVING, QueueToken.QueueStatus.COMPLETED])

    service_duration_queryset = completed_queryset.annotate(
        service_duration=ExpressionWrapper(F("completed_at") - F("serving_at"), output_field=DurationField())
    )
    wait_duration_queryset = called_queryset.exclude(called_at__isnull=True).annotate(
        wait_duration=ExpressionWrapper(F("called_at") - F("created_at"), output_field=DurationField())
    )

    average_service_duration = service_duration_queryset.aggregate(avg=Avg("service_duration"))["avg"]
    average_wait_duration = wait_duration_queryset.aggregate(avg=Avg("wait_duration"))["avg"]

    peak_hours = (
        today_queryset.annotate(hour=ExtractHour("created_at"))
        .values("hour")
        .annotate(total=Count("id"))
        .order_by("-total", "hour")[:3]
    )

    total_today = today_queryset.count() or 1
    no_show_count = today_queryset.filter(status=QueueToken.QueueStatus.NO_SHOW).count()
    completed_count = completed_queryset.count()

    service_load = list(
        today_queryset.values("service__name").annotate(total=Count("id")).order_by("-total", "service__name")[:5]
    )
    counter_performance = list(
        completed_queryset.values("counter__name")
        .annotate(total=Count("id"))
        .order_by("-total", "counter__name")[:5]
    )

    insights = []
    if peak_hours:
        first_peak = peak_hours[0]
        insights.append("Peak load expected soon")
        insights.append(f"Highest load window centers around {first_peak['hour']:02d}:00")
    if no_show_count / total_today > 0.15:
        insights.append("No-show rate increased today")
    if counter_performance and len(counter_performance) > 1 and counter_performance[-1]["total"] < counter_performance[0]["total"]:
        insights.append(f"{counter_performance[-1]['counter__name'] or 'A counter'} is slower than average")
    if branch:
        prediction = estimate_wait_time(branch)
        if prediction.estimated_wait_minutes >= 15:
            insights.append("Add one more counter to reduce wait time")
    else:
        busiest_branch = (
            Branch.objects.filter(organization_id=organization_id)
            .annotate(queue_total=Count("queue_tokens"))
            .order_by("-queue_total", "name")
            .first()
            if organization_id
            else None
        )
        prediction = estimate_wait_time(busiest_branch) if busiest_branch else None

    return {
        "average_wait_time_minutes": int((average_wait_duration.total_seconds() // 60) if average_wait_duration else 0),
        "average_service_time_minutes": int((average_service_duration.total_seconds() // 60) if average_service_duration else 0),
        "peak_hours": [
            {"hour": item["hour"], "total": item["total"]}
            for item in peak_hours
        ],
        "no_show_rate": round((no_show_count / total_today) * 100, 2),
        "completed_tokens": completed_count,
        "queue_load_by_service": [
            {"service": item["service__name"], "total": item["total"]}
            for item in service_load
        ],
        "counter_performance": [
            {"counter": item["counter__name"] or "Unassigned", "total": item["total"]}
            for item in counter_performance
        ],
        "insights": insights[:4],
        "prediction": {
            "estimated_wait_minutes": prediction.estimated_wait_minutes,
            "confidence": prediction.confidence,
        } if prediction else None,
    }
