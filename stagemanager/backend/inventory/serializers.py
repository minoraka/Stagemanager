from rest_framework import serializers

from .models import Category, Equipment


class CategorySerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)
    equipment_count = serializers.IntegerField(source="equipment.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "kind", "kind_label", "equipment_count"]


class EquipmentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    kind = serializers.CharField(source="category.kind", read_only=True)
    kind_label = serializers.CharField(source="category.get_kind_display", read_only=True)
    serviceable = serializers.IntegerField(read_only=True)
    booked = serializers.SerializerMethodField()
    available = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = ["id", "name", "category", "category_name", "kind", "kind_label", "manufacturer", "model",
                  "description", "total_quantity", "in_repair_quantity", "serviceable", "booked", "available"]

    def get_booked(self, obj):
        """Максимум занятых единиц за выбранный период (None, если период не задан)."""
        booked_map = self.context.get("booked_map")
        return None if booked_map is None else booked_map.get(obj.id, 0)

    def get_available(self, obj):
        booked = self.get_booked(obj)
        return None if booked is None else max(obj.serviceable - booked, 0)

    def validate(self, attrs):
        total = attrs.get("total_quantity", getattr(self.instance, "total_quantity", 1))
        repair = attrs.get("in_repair_quantity", getattr(self.instance, "in_repair_quantity", 0))
        if repair > total:
            raise serializers.ValidationError({"in_repair_quantity": "В ремонте не может быть больше, чем всего."})
        return attrs
