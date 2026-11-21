from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Администратор"
        MANAGER = "manager", "Менеджер"
        TECHNICIAN = "technician", "Технарь"

    role = models.CharField("Роль", max_length=20, choices=Role.choices, default=Role.TECHNICIAN)

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    @property
    def can_edit(self):
        return self.role in (self.Role.ADMIN, self.Role.MANAGER)
