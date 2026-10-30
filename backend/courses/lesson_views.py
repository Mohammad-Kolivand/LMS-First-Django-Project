from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied

from .models import Course, Lesson
from .serializers import LessonSerializer


def accessible_courses(user):
    courses = Course.objects.select_related("instructor")

    if (
        user.is_authenticated
        and user.is_active
        and user.role == "instructor"
    ):
        return courses.filter(
            Q(is_published=True) | Q(instructor=user)
        )

    return courses.filter(is_published=True)


class CourseLessonListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_course(self):
        return get_object_or_404(
            accessible_courses(self.request.user),
            slug=self.kwargs["slug"],
        )

    def get_queryset(self):
        return self.get_course().lessons.all()

    def list(self, request, *args, **kwargs):
        course = self.get_course()

        if not course.is_published and not (
            request.user.is_authenticated
            and request.user.is_active
            and request.user.role == "instructor"
            and course.instructor_id == request.user.id
        ):
            raise PermissionDenied(
                "You do not have permission to view these lessons."
            )

        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        course = self.get_course()
        user = self.request.user

        if not (
            user.is_authenticated
            and user.is_active
            and user.role == "instructor"
            and course.instructor_id == user.id
        ):
            raise PermissionDenied(
                "Only the course owner can create lessons."
            )

        serializer.save(course=course)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["course"] = self.get_course()
        return context

class CourseLessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Lesson.objects.filter(
            course__in=accessible_courses(self.request.user),
        ).select_related(
            "course",
            "course__instructor",
        )

    def get_object(self):
        lesson = get_object_or_404(
            self.get_queryset(),
            course__slug=self.kwargs["slug"],
            pk=self.kwargs["lesson_id"],
        )

        user = self.request.user

        if self.request.method not in permissions.SAFE_METHODS:
            if not (
                user.is_authenticated
                and user.is_active
                and user.role == "instructor"
                and lesson.course.instructor_id == user.id
            ):
                raise PermissionDenied(
                    "Only the course owner can modify lessons."
                )

        self.check_object_permissions(self.request, lesson)
        return lesson
