from django.db.models import ProtectedError
from django.utils.dateparse import parse_date
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from accounts.permissions import ReadOnlyOrManager
from events.services import peak_booked

from .models import Category, Equipment
from .serializers import CategorySerializer, EquipmentSerializer


class ProtectedDeleteMixin:
    protected_message = "Нельзя удалить: объект используется."

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            raise ValidationError({"detail": self.protected_message})


class CategoryViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrManager]
    protected_message = "Нельзя удалить категорию, в которой есть оборудование."


class EquipmentViewSet(ProtectedDeleteMixin, viewsets.ModelViewSet):
    serializer_class = EquipmentSerializer
    permission_classes = [ReadOnlyOrManager]
    search_fields = ["name", "manufacturer", "model", "category__name"]
    ordering_fields = ["name", "total_quantity", "category__name"]
    protected_message = "Нельзя удалить оборудование, которое забронировано на мероприятия."

    def get_queryset(self):
        qs = Equipment.objects.select_related("category")
        p = self.request.query_params
        if p.get("kind"):
            qs = qs.filter(category__kind=p["kind"])
        if p.get("category"):
            qs = qs.filter(category_id=p["category"])
        if p.get("in_repair") == "1":
            qs = qs.filter(in_repair_quantity__gt=0)
        return qs

    def _period(self):
        p = self.request.query_params
        start, end = parse_date(p.get("date_from") or ""), parse_date(p.get("date_to") or "")
        if start and not end:
            end = start
        if start and end and end >= start:
            return start, end
        return None

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        period = self._period()
        if period:
            exclude = self.request.query_params.get("exclude_event")
            ctx["booked_map"] = peak_booked(*period, exclude_event_id=int(exclude) if exclude else None)
        return ctx
