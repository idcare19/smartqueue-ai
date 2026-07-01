from rest_framework.permissions import BasePermission

from apps.accounts.models import UserRole


def role_in(user, *roles: str) -> bool:
    return bool(user and user.is_authenticated and user.role in roles)


class SmartQueueModelPermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or user.role == UserRole.SUPER_ADMIN:
            return True

        organization = getattr(obj, "organization", None)
        branch = getattr(obj, "branch", None)
        counter = getattr(obj, "counter", None)

        if user.role == UserRole.ORGANIZATION_ADMIN:
            return organization and organization_id(user) == organization.id

        if user.role == UserRole.BRANCH_MANAGER:
            return branch and user.branch_id == branch.id

        if user.role in {UserRole.STAFF, UserRole.RECEPTIONIST}:
            if branch and user.branch_id == branch.id:
                if counter is None:
                    return True
                return counter.assigned_staff.filter(id=user.id).exists()
        return False


def organization_id(user):
    return getattr(user, "organization_id", None)

