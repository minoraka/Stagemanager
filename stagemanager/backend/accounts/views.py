from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .permissions import IsAdmin
from .serializers import UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    search_fields = ["username", "first_name", "last_name", "email"]

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise ValidationError({"detail": "Нельзя удалить самого себя."})
        instance.delete()

    def perform_update(self, serializer):
        user = serializer.instance
        if user == self.request.user and (
            serializer.validated_data.get("role", user.role) != "admin"
            or not serializer.validated_data.get("is_active", user.is_active)
        ):
            raise ValidationError({"detail": "Нельзя понизить или отключить самого себя."})
        serializer.save()


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)
