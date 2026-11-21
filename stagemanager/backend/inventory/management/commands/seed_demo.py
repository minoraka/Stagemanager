from datetime import date, timedelta

from django.core.management.base import BaseCommand

from accounts.models import User
from events.models import Booking, Event
from inventory.models import Category, Equipment


class Command(BaseCommand):
    help = "Создаёт демо-пользователей, оборудование и мероприятие"

    def handle(self, *args, **opts):
        users = [("admin", "admin", "Админ"), ("manager", "manager", "Менеджер"), ("tech", "technician", "Технарь")]
        for username, role, first in users:
            u, created = User.objects.get_or_create(username=username, defaults={"role": role, "first_name": first})
            if created:
                u.set_password(f"{username}123")
                u.is_staff = role == "admin"
                u.is_superuser = role == "admin"
                u.save()

        cats = {}
        for name, kind in [("Заливающий свет", "light"), ("Вращающаяся голова", "light"), ("Акустика", "sound"),
                           ("Микшерные пульты", "sound"), ("Микрофоны", "sound"), ("Коммутация", "stage")]:
            cats[name], _ = Category.objects.get_or_create(name=name, defaults={"kind": kind})

        items = [
            ("Par LED 18x10W", "Заливающий свет", "Showtec", "Par 18", 24, 2),
            ("Moving Head Beam 230", "Вращающаяся голова", "Robe", "Pointe", 8, 0),
            ("Линейный массив", "Акустика", "L-Acoustics", "KARA II", 12, 0),
            ("Сабвуфер", "Акустика", "L-Acoustics", "KS28", 6, 1),
            ("Цифровой микшер", "Микшерные пульты", "Yamaha", "CL5", 1, 0),
            ("Радиомикрофон ручной", "Микрофоны", "Shure", "ULXD2/SM58", 8, 0),
            ("Мультикор 32 канала", "Коммутация", "Klotz", "MC32", 2, 0),
        ]
        for name, cat, man, model, total, repair in items:
            Equipment.objects.get_or_create(name=name, defaults=dict(
                category=cats[cat], manufacturer=man, model=model, total_quantity=total, in_repair_quantity=repair))

        start = date.today() + timedelta(days=7)
        ev, created = Event.objects.get_or_create(
            title="Концерт «Весенний аншлаг»",
            defaults=dict(venue="Дворец спорта", start_date=start, end_date=start + timedelta(days=1),
                          status="confirmed", rider_notes="Загрузка в 10:00, саундчек в 16:00."))
        if created:
            for name, qty in [("Par LED 18x10W", 16), ("Moving Head Beam 230", 6), ("Линейный массив", 12)]:
                Booking.objects.create(event=ev, equipment=Equipment.objects.get(name=name), quantity=qty)
        self.stdout.write(self.style.SUCCESS("Готово. Логины: admin/admin123, manager/manager123, tech/tech123"))
