from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.queues.models import QueueToken

from .models import Notification, NotificationLog, NotificationStatus, NotificationTemplate
from .serializers import (
    NotificationLogSerializer,
    NotificationSerializer,
    NotificationStatsSerializer,
    NotificationTemplateSerializer,
)
from .services import notification_statistics, provider_overview, retry_failed_notification


class NotificationPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = "page_size"
    max_page_size = 50


def can_manage_notifications(user):
    return bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or user.role in {UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.BRANCH_MANAGER}
        )
    )


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination
    queryset = Notification.objects.select_related("queue_token", "recipient_user", "branch", "organization")

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user
        search = self.request.query_params.get("search")
        filter_status = self.request.query_params.get("status")
        event_type = self.request.query_params.get("event_type")
        queue_token_id = self.request.query_params.get("queue_token")

        if user.is_superuser or user.role == UserRole.SUPER_ADMIN:
            pass
        else:
            queryset = queryset.filter(Q(recipient_user=user) | Q(branch_id=user.branch_id) | Q(organization_id=user.organization_id))

        if queue_token_id:
            queryset = queryset.filter(queue_token_id=queue_token_id)
        if filter_status:
            queryset = queryset.filter(status=filter_status)
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(message__icontains=search)
                | Q(destination__icontains=search)
                | Q(queue_token__token_number__icontains=search)
            )
        return queryset

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.status = NotificationStatus.READ
        notification.read_at = timezone.now()
        notification.save(update_fields=["status", "read_at", "updated_at"])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        updated = self.get_queryset().exclude(status=NotificationStatus.READ).update(
            status=NotificationStatus.READ,
            read_at=timezone.now(),
        )
        return Response({"updated": updated})

    @action(detail=True, methods=["post"], url_path="retry")
    def retry(self, request, pk=None):
        notification = self.get_object()
        notification = retry_failed_notification(notification)
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny], url_path="customer-history")
    def customer_history(self, request):
        token_number = request.query_params.get("token")
        mobile_number = request.query_params.get("mobile")
        token = QueueToken.objects.filter(token_number=token_number, mobile_number=mobile_number).first()
        if not token:
            return Response({"detail": "Token not found."}, status=status.HTTP_404_NOT_FOUND)
        queryset = Notification.objects.filter(queue_token=token)
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination
    queryset = NotificationTemplate.objects.all()

    def get_queryset(self):
        return self.queryset.order_by("event_type", "channel", "name")

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not can_manage_notifications(request.user):
            self.permission_denied(request, message="You do not have access to manage notification templates.")


class NotificationLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination
    queryset = NotificationLog.objects.select_related("notification")

    def get_queryset(self):
        queryset = self.queryset
        user = self.request.user
        if not can_manage_notifications(user):
            return queryset.none()
        if user.role == UserRole.ORGANIZATION_ADMIN:
            queryset = queryset.filter(notification__organization_id=user.organization_id)
        if user.role == UserRole.BRANCH_MANAGER:
            queryset = queryset.filter(notification__branch_id=user.branch_id)
        if self.request.query_params.get("status"):
            queryset = queryset.filter(status=self.request.query_params["status"])
        return queryset


class NotificationStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not can_manage_notifications(request.user):
            return Response({"detail": "You do not have access to notification statistics."}, status=status.HTTP_403_FORBIDDEN)
        organization_id = None if request.user.role == UserRole.SUPER_ADMIN else request.user.organization_id
        branch_id = request.user.branch_id if request.user.role == UserRole.BRANCH_MANAGER else None
        payload = notification_statistics(organization_id=organization_id, branch_id=branch_id)
        return Response(NotificationStatsSerializer(payload).data)


class ProviderOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not can_manage_notifications(request.user):
            return Response({"detail": "You do not have access to provider settings."}, status=status.HTTP_403_FORBIDDEN)
        return Response(provider_overview())
