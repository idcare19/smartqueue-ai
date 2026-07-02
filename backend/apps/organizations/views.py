from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import UserRole
from apps.core.permissions import SmartQueueModelPermission

from .models import Branch, Counter, Department, Organization, Service
from .serializers import BranchSerializer, CounterSerializer, DepartmentSerializer, OrganizationSerializer, ServiceSerializer


class ScopedQuerysetMixin:
    def get_scoped_queryset(self, queryset):
        user = self.request.user
        if user.is_superuser or user.role == UserRole.SUPER_ADMIN:
            return queryset
        if user.role == UserRole.ORGANIZATION_ADMIN:
            return queryset.filter(organization_id=user.organization_id)
        if user.role == UserRole.BRANCH_MANAGER:
            return queryset.filter(branch_id=user.branch_id) if hasattr(queryset.model, "branch_id") else queryset.filter(id=user.branch_id)
        if user.role in {UserRole.STAFF, UserRole.RECEPTIONIST}:
            if hasattr(queryset.model, "branch_id"):
                return queryset.filter(branch_id=user.branch_id)
            return queryset.none()
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        organization = serializer.validated_data.get("organization")
        branch = serializer.validated_data.get("branch")
        if user.role == UserRole.ORGANIZATION_ADMIN and organization and organization.id != user.organization_id:
            raise PermissionDenied("You can only manage your own organization.")
        if user.role == UserRole.BRANCH_MANAGER and branch and branch.id != user.branch_id:
            raise PermissionDenied("You can only manage your own branch.")
        serializer.save()


class OrganizationViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [SmartQueueModelPermission]
    queryset = Organization.objects.all()

    def get_queryset(self):
        return self.get_scoped_queryset(self.queryset)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = True
        instance.save(update_fields=["is_active"])
        return Response(self.get_serializer(instance).data)


class BranchViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [SmartQueueModelPermission]
    queryset = Branch.objects.select_related("organization", "manager")

    def get_queryset(self):
        return self.get_scoped_queryset(self.queryset)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = True
        instance.save(update_fields=["is_active"])
        return Response(self.get_serializer(instance).data)


class ServiceViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [SmartQueueModelPermission]
    queryset = Service.objects.select_related("organization", "branch")

    def get_queryset(self):
        return self.get_scoped_queryset(self.queryset)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = True
        instance.save(update_fields=["is_active"])
        return Response(self.get_serializer(instance).data)


class CounterViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = CounterSerializer
    permission_classes = [SmartQueueModelPermission]
    queryset = Counter.objects.select_related("organization", "branch").prefetch_related("assigned_staff", "queue_tokens")

    def get_queryset(self):
        return self.get_scoped_queryset(self.queryset)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = True
        instance.save(update_fields=["is_active"])
        return Response(self.get_serializer(instance).data)


class DepartmentViewSet(ScopedQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [SmartQueueModelPermission]
    queryset = Department.objects.select_related("organization", "branch")

    def get_queryset(self):
        return self.get_scoped_queryset(self.queryset)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = True
        instance.save(update_fields=["is_active"])
        return Response(self.get_serializer(instance).data)
