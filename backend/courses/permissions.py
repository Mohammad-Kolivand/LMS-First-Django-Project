from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsInstructorOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        return (
            user.is_authenticated
            and user.is_active
            and user.role == "instructor"
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        return (
            obj.instructor_id == request.user.id
            and request.user.is_active
            and request.user.role == "instructor"
        )
