from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.core.permissions import SmartQueueModelPermission
from apps.notifications.models import NotificationEvent
from apps.notifications.services import notify_queue_event
from apps.organizations.models import Counter

from .events import broadcast_queue_event
from .models import QueueToken
from .serializers import JoinQueueSerializer, QueueActionSerializer, QueueTokenSerializer


class QueueTokenViewSet(viewsets.ModelViewSet):
    serializer_class = QueueTokenSerializer
    permission_classes = [SmartQueueModelPermission]
    queryset = QueueToken.objects.select_related("organization", "branch", "service", "counter")

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user

        if self.action in {"public_status", "customer_status"}:
            return queryset

        if user.is_superuser or user.role == UserRole.SUPER_ADMIN:
            return queryset
        if user.role == UserRole.ORGANIZATION_ADMIN:
            return queryset.filter(organization_id=user.organization_id)
        if user.role == UserRole.BRANCH_MANAGER:
            return queryset.filter(branch_id=user.branch_id)
        if user.role in {UserRole.STAFF, UserRole.RECEPTIONIST}:
            return queryset.filter(branch_id=user.branch_id).filter(
                Q(counter__assigned_staff=user) | Q(counter__isnull=True)
            )
        return queryset.none()

    def get_permissions(self):
        if self.action in {"join_queue", "public_status", "customer_status"}:
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=["post"], url_path="join")
    def join_queue(self, request):
        serializer = JoinQueueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.save()
        broadcast_queue_event(token, "token.created")
        notify_queue_event(NotificationEvent.QUEUE_JOINED, token)
        return Response(QueueTokenSerializer(token).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="staff-dashboard")
    def staff_dashboard(self, request):
        branch_id = request.query_params.get("branch")
        counter_id = request.query_params.get("counter")
        queryset = self.get_queryset().exclude(status__in=["completed", "cancelled", "no_show"])
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        if counter_id:
            queryset = queryset.filter(counter_id=counter_id)
        return Response(QueueTokenSerializer(queryset.order_by("sequence_number"), many=True).data)

    @action(detail=False, methods=["get"], url_path="public-status")
    def public_status(self, request):
        branch_id = request.query_params.get("branch")
        queryset = self.queryset.exclude(status__in=["completed", "cancelled", "no_show"])
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        tokens = queryset.order_by("sequence_number")[:10]
        return Response(QueueTokenSerializer(tokens, many=True).data)

    @action(detail=False, methods=["get"], url_path="customer-status")
    def customer_status(self, request):
        token_number = request.query_params.get("token")
        mobile_number = request.query_params.get("mobile")
        token = generics.get_object_or_404(self.queryset, token_number=token_number, mobile_number=mobile_number)
        ahead = self.queryset.filter(
            branch=token.branch,
            queue_date=token.queue_date,
            sequence_number__lt=token.sequence_number,
            status__in=["waiting", "called", "serving"],
        ).count()
        payload = QueueTokenSerializer(token).data
        payload["people_ahead"] = ahead
        payload["estimated_wait_minutes"] = ahead * token.service.duration_minutes
        return Response(payload)

    def _move_status(self, token: QueueToken, status_value: str, counter: Counter | None = None, note: str = "", notify: bool = True):
        token.status = status_value
        if counter:
            token.counter = counter
        if note:
            token.note = note
        if status_value == QueueToken.QueueStatus.CALLED:
            token.called_at = timezone.now()
        if status_value == QueueToken.QueueStatus.SERVING:
            token.serving_at = timezone.now()
        if status_value == QueueToken.QueueStatus.COMPLETED:
            token.completed_at = timezone.now()
        token.save()
        event_map = {
            QueueToken.QueueStatus.CALLED: "token.called",
            QueueToken.QueueStatus.SERVING: "token.serving",
            QueueToken.QueueStatus.COMPLETED: "token.completed",
            QueueToken.QueueStatus.SKIPPED: "token.skipped",
            QueueToken.QueueStatus.NO_SHOW: "token.no_show",
            QueueToken.QueueStatus.CANCELLED: "token.cancelled",
        }
        broadcast_queue_event(token, event_map.get(status_value, "queue.updated"))
        notification_event_map = {
            QueueToken.QueueStatus.CALLED: NotificationEvent.TOKEN_CALLED,
            QueueToken.QueueStatus.COMPLETED: NotificationEvent.QUEUE_COMPLETED,
            QueueToken.QueueStatus.CANCELLED: NotificationEvent.QUEUE_CANCELLED,
        }
        notification_event = notification_event_map.get(status_value)
        if notification_event and notify:
            notify_queue_event(notification_event, token, actor=self.request.user if self.request.user.is_authenticated else None)
        return token

    @action(detail=False, methods=["post"], url_path="call-next")
    def call_next(self, request):
        serializer = QueueActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        counter = serializer.validated_data.get("counter")
        branch_id = request.data.get("branch")
        queryset = self.get_queryset().filter(status=QueueToken.QueueStatus.WAITING)
        if counter:
            queryset = queryset.filter(branch=counter.branch)
        elif branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        token = queryset.order_by("sequence_number").first()
        if not token:
            return Response({"detail": "No waiting tokens available."}, status=status.HTTP_404_NOT_FOUND)
        token = self._move_status(token, QueueToken.QueueStatus.CALLED, counter=counter, note=serializer.validated_data.get("note", ""))
        return Response(QueueTokenSerializer(token).data)

    @action(detail=True, methods=["post"], url_path="recall")
    def recall(self, request, pk=None):
        token = self.get_object()
        token = self._move_status(token, QueueToken.QueueStatus.CALLED, note=request.data.get("note", ""), notify=False)
        broadcast_queue_event(token, "token.recalled")
        notify_queue_event(NotificationEvent.TOKEN_RECALLED, token, actor=request.user if request.user.is_authenticated else None)
        return Response(QueueTokenSerializer(token).data)

    @action(detail=True, methods=["post"], url_path="skip")
    def skip(self, request, pk=None):
        token = self.get_object()
        token = self._move_status(token, QueueToken.QueueStatus.SKIPPED, note=request.data.get("note", ""))
        return Response(QueueTokenSerializer(token).data)

    @action(detail=True, methods=["post"], url_path="serving")
    def mark_serving(self, request, pk=None):
        token = self.get_object()
        token = self._move_status(token, QueueToken.QueueStatus.SERVING, note=request.data.get("note", ""))
        return Response(QueueTokenSerializer(token).data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        token = self.get_object()
        token = self._move_status(token, QueueToken.QueueStatus.COMPLETED, note=request.data.get("note", ""))
        return Response(QueueTokenSerializer(token).data)

    @action(detail=True, methods=["post"], url_path="no-show")
    def no_show(self, request, pk=None):
        token = self.get_object()
        token = self._move_status(token, QueueToken.QueueStatus.NO_SHOW, note=request.data.get("note", ""))
        return Response(QueueTokenSerializer(token).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        token = self.get_object()
        token = self._move_status(token, QueueToken.QueueStatus.CANCELLED, note=request.data.get("note", ""))
        return Response(QueueTokenSerializer(token).data)
