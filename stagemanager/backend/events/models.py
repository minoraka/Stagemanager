from django.conf import settings
from django.db import models


class Event(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Черновик"
        CONFIRMED = "confirmed", "Подтверждено"
        COMPLETED = "completed", "Завершено"
        CANCELLED = "cancelled", "Отменено"

    title = models.CharField("Название", max_length=200)
    venue = models.CharField("Площадка", max_length=200, blank=True)
    start_date = models.DateField("Начало")
    end_date = models.DateField("Окончание")
    status = models.CharField("Статус", max_length=12, choices=Status.choices, default=Status.DRAFT)
    description = models.TextField("Описание", blank=True)
    rider_notes = models.TextField("Заметки для райдера", blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name="events")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_date", "title"]
        verbose_name = "Мероприятие"
        verbose_name_plural = "Мероприятия"

    def __str__(self):
        return self.title


class Booking(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="bookings")
    equipment = models.ForeignKey("inventory.Equipment", on_delete=models.PROTECT, related_name="bookings")
    quantity = models.PositiveIntegerField("Количество", default=1)
    note = models.CharField("Примечание", max_length=255, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["event", "equipment"], name="unique_equipment_per_event")]
        ordering = ["equipment__category__kind", "equipment__name"]
        verbose_name = "Бронь"
        verbose_name_plural = "Брони"

    def __str__(self):
        return f"{self.event} — {self.equipment} × {self.quantity}"
