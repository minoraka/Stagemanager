from rest_framework import serializers

from .models import Booking, Event
from .services import find_conflicts, peak_booked


class BookingSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source="equipment.name", read_only=True)
    manufacturer = serializers.CharField(source="equipment.manufacturer", read_only=True)
    model = serializers.CharField(source="equipment.model", read_only=True)
    category_name = serializers.CharField(source="equipment.category.name", read_only=True)
    kind = serializers.CharField(source="equipment.category.kind", read_only=True)

    class Meta:
        model = Booking
        fields = ["id", "event", "equipment", "equipment_name", "manufacturer", "model",
                  "category_name", "kind", "quantity", "note"]
        validators = []  # уникальность проверяем сами — с понятным сообщением

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Количество должно быть не меньше 1.")
        return value

    def validate(self, attrs):
        inst = self.instance
        event = inst.event if inst else attrs["event"]
        equipment = inst.equipment if inst else attrs["equipment"]
        quantity = attrs.get("quantity", inst.quantity if inst else 1)

        if event.status in (Event.Status.CANCELLED, Event.Status.COMPLETED):
            raise serializers.ValidationError({"detail": "Мероприятие отменено или завершено — бронь менять нельзя."})
        if not inst and Booking.objects.filter(event=event, equipment=equipment).exists():
            raise serializers.ValidationError(
                {"equipment": "Эта позиция уже есть в списке — измените её количество."})

        busy = peak_booked(event.start_date, event.end_date, equipment_id=equipment.id,
                           exclude_booking_id=inst.pk if inst else None).get(equipment.id, 0)
        free = max(equipment.serviceable - busy, 0)
        if quantity > free:
            raise serializers.ValidationError(
                {"quantity": f"На даты мероприятия свободно только {free} шт."})
        return attrs

    def update(self, instance, validated_data):
        validated_data.pop("event", None)
        validated_data.pop("equipment", None)
        return super().update(instance, validated_data)


class EventSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    bookings_count = serializers.IntegerField(source="bookings.count", read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ["id", "title", "venue", "start_date", "end_date", "status", "status_label", "description",
                  "rider_notes", "bookings_count", "created_by_name", "created_at"]

    def get_created_by_name(self, obj):
        u = obj.created_by
        return (u.get_full_name() or u.username) if u else ""

    def validate(self, attrs):
        inst = self.instance
        start = attrs.get("start_date", inst.start_date if inst else None)
        end = attrs.get("end_date", inst.end_date if inst else None)
        status = attrs.get("status", inst.status if inst else Event.Status.DRAFT)
        if start and end and end < start:
            raise serializers.ValidationError({"end_date": "Дата окончания раньше даты начала."})
        if inst and status != Event.Status.CANCELLED and (
            start != inst.start_date or end != inst.end_date or inst.status == Event.Status.CANCELLED
        ):
            problems = find_conflicts(inst, start, end)
            if problems:
                raise serializers.ValidationError(
                    {"detail": "На новые даты не хватает оборудования: " + "; ".join(problems)})
        return attrs
