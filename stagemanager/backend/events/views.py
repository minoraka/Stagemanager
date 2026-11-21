from datetime import date, timedelta

from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import ReadOnlyOrManager
from inventory.models import Category, Equipment

from .models import Booking, Event
from .serializers import BookingSerializer, EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [ReadOnlyOrManager]
    search_fields = ["title", "venue"]
    ordering_fields = ["start_date", "title"]

    def get_queryset(self):
        qs = Event.objects.select_related("created_by")
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("upcoming") == "1":
            qs = qs.filter(end_date__gte=date.today()).exclude(status=Event.Status.CANCELLED)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"])
    def rider(self, request, pk=None):
        """Технический райдер: оборудование мероприятия по разделам + заметки."""
        event = self.get_object()
        labels = dict(Category.Kind.choices)
        sections = {}
        bookings = event.bookings.select_related("equipment__category")
        for b in bookings:
            kind = b.equipment.category.kind
            sec = sections.setdefault(kind, {"kind": kind, "label": labels[kind], "items": []})
            sec["items"].append({
                "id": b.id, "name": b.equipment.name, "category": b.equipment.category.name,
                "manufacturer": b.equipment.manufacturer, "model": b.equipment.model,
                "quantity": b.quantity, "note": b.note,
            })
        order = [k for k, _ in Category.Kind.choices if k in sections]
        return Response({
            "event": EventSerializer(event).data,
            "sections": [sections[k] for k in order],
            "total_units": sum(b.quantity for b in bookings),
        })


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [ReadOnlyOrManager]

    def get_queryset(self):
        qs = Booking.objects.select_related("equipment__category", "event")
        if self.request.query_params.get("event"):
            qs = qs.filter(event_id=self.request.query_params["event"])
        return qs


class StatsView(APIView):
    def get(self, request):
        today = date.today()
        agg = Equipment.objects.aggregate(total=Sum("total_quantity"), repair=Sum("in_repair_quantity"))
        upcoming = Event.objects.filter(end_date__gte=today).exclude(status=Event.Status.CANCELLED)[:5]
        return Response({
            "positions": Equipment.objects.count(),
            "units_total": agg["total"] or 0,
            "units_in_repair": agg["repair"] or 0,
            "events_next_30_days": Event.objects.filter(
                start_date__lte=today + timedelta(days=30), end_date__gte=today
            ).exclude(status=Event.Status.CANCELLED).count(),
            "upcoming": EventSerializer(upcoming, many=True).data,
        })
