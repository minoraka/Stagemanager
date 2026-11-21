from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdmin(BasePermission):
    """Только администратор."""

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.role == "admin")


class ReadOnlyOrManager(BasePermission):
    """Читать могут все авторизованные, изменять — админ и менеджер."""

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        return request.method in SAFE_METHODS or u.can_edit
