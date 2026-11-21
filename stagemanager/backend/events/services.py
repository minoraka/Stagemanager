from collections import defaultdict
from datetime import timedelta

from .models import Booking, Event


def peak_booked(start, end, equipment_id=None, exclude_event_id=None, exclude_booking_id=None):
    """
    Для каждой позиции оборудования считает максимум единиц, занятых в любой
    из дней периода [start, end]. Отменённые мероприятия не учитываются.
    Возвращает {equipment_id: число}.
    """
    qs = Booking.objects.filter(event__start_date__lte=end, event__end_date__gte=start).exclude(
        event__status=Event.Status.CANCELLED
    )
    if equipment_id:
        qs = qs.filter(equipment_id=equipment_id)
    if exclude_event_id:
        qs = qs.exclude(event_id=exclude_event_id)
    if exclude_booking_id:
        qs = qs.exclude(pk=exclude_booking_id)

    per_day = defaultdict(lambda: defaultdict(int))
    for eq_id, qty, ev_start, ev_end in qs.values_list(
        "equipment_id", "quantity", "event__start_date", "event__end_date"
    ):
        day, last = max(ev_start, start), min(ev_end, end)
        while day <= last:
            per_day[eq_id][day] += qty
            day += timedelta(days=1)
    return {eq: max(days.values()) for eq, days in per_day.items()}


def find_conflicts(event, start, end):
    """Проверяет, помещаются ли текущие брони мероприятия в новые даты. Возвращает названия проблемных позиций."""
    busy = peak_booked(start, end, exclude_event_id=event.pk)
    problems = []
    for b in event.bookings.select_related("equipment"):
        free = b.equipment.serviceable - busy.get(b.equipment_id, 0)
        if b.quantity > free:
            problems.append(f"{b.equipment.name} (нужно {b.quantity}, свободно {max(free, 0)})")
    return problems
