from django.contrib import admin

from .models import Booking, Event


class BookingInline(admin.TabularInline):
    model = Booking
    extra = 0


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "venue", "start_date", "end_date", "status")
    inlines = [BookingInline]
