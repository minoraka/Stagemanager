from datetime import date, timedelta

from rest_framework.test import APITestCase

from accounts.models import User
from inventory.models import Category, Equipment

from .models import Booking, Event


class StageManagerTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("a", password="pass1234", role="admin")
        self.manager = User.objects.create_user("m", password="pass1234", role="manager")
        self.tech = User.objects.create_user("t", password="pass1234", role="technician")
        cat = Category.objects.create(name="Свет", kind="light")
        self.eq = Equipment.objects.create(name="Par", category=cat, total_quantity=10, in_repair_quantity=2)
        d = date.today() + timedelta(days=5)
        self.d = d
        self.e1 = Event.objects.create(title="A", start_date=d, end_date=d + timedelta(days=1))
        self.e2 = Event.objects.create(title="B", start_date=d + timedelta(days=1), end_date=d + timedelta(days=2))
        self.e3 = Event.objects.create(title="C", start_date=d + timedelta(days=10), end_date=d + timedelta(days=10))

    def book(self, ev, qty):
        return self.client.post("/api/bookings/", {"event": ev.id, "equipment": self.eq.id, "quantity": qty})

    def test_overbooking_blocked_on_overlap(self):
        self.client.force_authenticate(self.manager)
        self.assertEqual(self.book(self.e1, 5).status_code, 201)       # исправно 8
        self.assertEqual(self.book(self.e2, 4).status_code, 400)       # пересечение, свободно 3
        self.assertEqual(self.book(self.e2, 3).status_code, 201)
        self.assertEqual(self.book(self.e3, 8).status_code, 201)       # даты не пересекаются

    def test_duplicate_booking(self):
        self.client.force_authenticate(self.manager)
        self.book(self.e1, 1)
        self.assertEqual(self.book(self.e1, 1).status_code, 400)

    def test_availability_endpoint(self):
        self.client.force_authenticate(self.tech)
        Booking.objects.create(event=self.e1, equipment=self.eq, quantity=5)
        r = self.client.get(f"/api/equipment/?date_from={self.d}&date_to={self.d}")
        self.assertEqual(r.data[0]["available"], 3)
        self.assertEqual(r.data[0]["serviceable"], 8)

    def test_move_event_conflict(self):
        self.client.force_authenticate(self.manager)
        Booking.objects.create(event=self.e1, equipment=self.eq, quantity=5)
        Booking.objects.create(event=self.e3, equipment=self.eq, quantity=6)
        r = self.client.patch(f"/api/events/{self.e3.id}/",
                              {"start_date": str(self.d), "end_date": str(self.d)})
        self.assertEqual(r.status_code, 400)

    def test_permissions(self):
        self.client.force_authenticate(self.tech)
        self.assertEqual(self.client.get("/api/equipment/").status_code, 200)
        self.assertEqual(self.client.post("/api/equipment/", {}).status_code, 403)
        self.assertEqual(self.client.get("/api/users/").status_code, 403)
        self.client.force_authenticate(self.manager)
        self.assertEqual(self.client.get("/api/users/").status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get("/api/users/").status_code, 200)

    def test_rider_and_protected_delete(self):
        self.client.force_authenticate(self.manager)
        Booking.objects.create(event=self.e1, equipment=self.eq, quantity=4)
        r = self.client.get(f"/api/events/{self.e1.id}/rider/")
        self.assertEqual(r.data["total_units"], 4)
        self.assertEqual(r.data["sections"][0]["label"], "Свет")
        self.assertEqual(self.client.delete(f"/api/equipment/{self.eq.id}/").status_code, 400)
