from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import MeView, UserViewSet
from events.views import BookingViewSet, EventViewSet, StatsView
from inventory.views import CategoryViewSet, EquipmentViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("categories", CategoryViewSet, basename="category")
router.register("equipment", EquipmentViewSet, basename="equipment")
router.register("events", EventViewSet, basename="event")
router.register("bookings", BookingViewSet, basename="booking")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),
    path("api/auth/me/", MeView.as_view()),
    path("api/stats/", StatsView.as_view()),
    path("api/", include(router.urls)),
]
