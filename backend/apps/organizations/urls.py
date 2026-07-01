from rest_framework.routers import DefaultRouter

from .views import BranchViewSet, CounterViewSet, DepartmentViewSet, OrganizationViewSet, ServiceViewSet

router = DefaultRouter()
router.register("organizations", OrganizationViewSet, basename="organization")
router.register("branches", BranchViewSet, basename="branch")
router.register("services", ServiceViewSet, basename="service")
router.register("counters", CounterViewSet, basename="counter")
router.register("departments", DepartmentViewSet, basename="department")

urlpatterns = router.urls
