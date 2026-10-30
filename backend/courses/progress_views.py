
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404

from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Course, Enrollment, Lesson, LessonProgress


class LessonCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug, lesson_id):
        user = request.user

        if not user.is_active or user.role != "student":
            raise PermissionDenied(
                "Only active students can complete lessons."
            )

        course = get_object_or_404(
            Course,
            slug=slug,
            is_published=True,
        )

        is_enrolled = Enrollment.objects.filter(
            student=user,
            course=course,
        ).exists()

        if not is_enrolled:
            raise PermissionDenied(
                "You must enroll in this course first."
            )

        lesson = get_object_or_404(
            Lesson,
            course=course,
            pk=lesson_id,
        )

        progress, created = LessonProgress.objects.get_or_create(
            student=user,
            lesson=lesson,
        )

        return Response(
            {
                "lesson_id": lesson.id,
                "completed": True,
                "completed_at": progress.completed_at,
                "already_completed": not created,
            },
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )


class MyProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if not user.is_active or user.role != "student":
            raise PermissionDenied(
                "Only active students can view learning progress."
            )

        enrollments = (
            Enrollment.objects.filter(
                student=user,
                course__is_published=True,
            )
            .select_related("course")
            .annotate(
                total_lessons=Count(
                    "course__lessons",
                    distinct=True,
                ),
                completed_lessons=Count(
                    "course__lessons__progress_records",
                    filter=Q(
                        course__lessons__progress_records__student=user,
                    ),
                    distinct=True,
                ),
            )
            .order_by("-enrolled_at", "-id")
        )

        results = []

        for enrollment in enrollments:
            total = enrollment.total_lessons
            completed = enrollment.completed_lessons

            results.append(
                {
                    "course_id": enrollment.course_id,
                    "course_title": enrollment.course.title,
                    "course_slug": enrollment.course.slug,
                    "total_lessons": total,
                    "completed_lessons": completed,
                    "progress_percent": (
                        round(completed * 100 / total)
                        if total
                        else 0
                    ),
                }
            )

        return Response(results)
