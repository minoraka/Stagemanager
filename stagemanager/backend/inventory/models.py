from django.db import models


class Category(models.Model):
    class Kind(models.TextChoices):
        LIGHT = "light", "Свет"
        SOUND = "sound", "Звук"
        STAGE = "stage", "Сцена и коммутация"
        OTHER = "other", "Прочее"

    name = models.CharField("Название", max_length=100, unique=True)
    kind = models.CharField("Тип", max_length=10, choices=Kind.choices, default=Kind.LIGHT)

    class Meta:
        ordering = ["kind", "name"]
        verbose_name = "Категория"
        verbose_name_plural = "Категории"

    def __str__(self):
        return self.name


class Equipment(models.Model):
    name = models.CharField("Название", max_length=150)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="equipment")
    manufacturer = models.CharField("Производитель", max_length=100, blank=True)
    model = models.CharField("Модель", max_length=100, blank=True)
    description = models.TextField("Описание", blank=True)
    total_quantity = models.PositiveIntegerField("Всего, шт.", default=1)
    in_repair_quantity = models.PositiveIntegerField("В ремонте, шт.", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category__kind", "name"]
        verbose_name = "Оборудование"
        verbose_name_plural = "Оборудование"

    @property
    def serviceable(self):
        """Исправные единицы: всего минус ремонт."""
        return max(self.total_quantity - self.in_repair_quantity, 0)

    def __str__(self):
        return self.name
