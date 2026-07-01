from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import SmartQueueModelPermission

from .models import User
from .serializers import StaffSerializer


class StaffViewSet(viewsets.ModelViewSet):
    serializer_class = StaffSerializer
    permission_classes = [SmartQueueModelPermission]
    queryset = User.objects.select_related("organization", "branch", "department", "assigned_counter")

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.filter(is_archived=False)
        if user.is_superuser or getattr(user, "role", None) == "super_admin":
            return queryset
        if getattr(user, "role", None) == "organization_admin":
            return queryset.filter(organization_id=user.organization_id)
        if getattr(user, "role", None) in {"branch_manager", "staff", "receptionist"}:
            return queryset.filter(branch_id=user.branch_id)
        return queryset.none()

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        staff = self.get_object()
        staff.is_suspended = True
        staff.is_active = False
        staff.save(update_fields=["is_suspended", "is_active"])
        return Response(self.get_serializer(staff).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        staff = self.get_object()
        staff.is_active = False
        staff.save(update_fields=["is_active"])
        return Response(self.get_serializer(staff).data)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        staff = User.objects.get(pk=pk)
        staff.is_archived = False
        staff.is_active = True
        staff.is_suspended = False
        staff.save(update_fields=["is_archived", "is_active", "is_suspended"])
        return Response(self.get_serializer(staff).data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        staff = self.get_object()
        staff.is_archived = True
        staff.is_active = False
        staff.save(update_fields=["is_archived", "is_active"])
        return Response(self.get_serializer(staff).data)

    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        return Response({"detail": "Password reset email flow is handled by auth endpoints."})

    @action(detail=True, methods=["post"])
    def online(self, request, pk=None):
        staff = self.get_object()
        staff.is_online = True
        staff.save(update_fields=["is_online"])
        return Response(self.get_serializer(staff).data)

    @action(detail=True, methods=["post"])
    def offline(self, request, pk=None):
        staff = self.get_object()
        staff.is_online = False
        staff.save(update_fields=["is_online"])
        return Response(self.get_serializer(staff).data)

    @action(detail=True, methods=["post"])
    def leave_mode(self, request, pk=None):
        staff = self.get_object()
        staff.is_on_leave = True
        staff.save(update_fields=["is_on_leave"])
        return Response(self.get_serializer(staff).data)
