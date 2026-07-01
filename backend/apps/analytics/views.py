from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import UserRole
from apps.organizations.models import Branch

from .serializers import AnalyticsSummarySerializer
from .services import analytics_summary


class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        branch_id = request.query_params.get("branch")
        branch = None

        if branch_id:
            branch = get_object_or_404(Branch, id=branch_id)

        if request.user.role == UserRole.BRANCH_MANAGER:
            branch = request.user.branch

        organization_id = request.user.organization_id if request.user.role != UserRole.SUPER_ADMIN else None
        payload = analytics_summary(branch=branch, organization_id=organization_id)
        serializer = AnalyticsSummarySerializer(payload)
        return Response(serializer.data)

