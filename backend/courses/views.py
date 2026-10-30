from django.db.models import Count, Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Course, Enrollment
from .permissions import IsInstructorOrReadOnly
from .serializers import (
    CategorySerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    CourseWriteSerializer,
    EnrollmentSerializer,
)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class CourseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsInstructorOrReadOnly]

    def get_queryset(self):
        user = self.request.user

        queryset = Course.objects.select_related(
            "category",
            "instructor",
        ).annotate(
            lesson_count=Count("lessons")
        ).order_by("title", "id")

        if self.request.method == "GET":
            if user.is_authenticated and user.role == "instructor":
                queryset = queryset.filter(
                    Q(is_published=True) | Q(instructor=user)
                )
            else:
                queryset = queryset.filter(is_published=True)

            category = self.request.query_params.get("category")
            level = self.request.query_params.get("level")
            search = self.request.query_params.get("search")

            if category:
                queryset = queryset.filter(category__slug=category)

            if level:
                queryset = queryset.filter(level=level)

            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search)
                    | Q(description__icontains=search)
                )

            return queryset

        if user.is_authenticated and user.role == "instructor":
            return queryset.filter(instructor=user)

        return queryset.none()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CourseWriteSerializer

        return CourseListSerializer

    def perform_create(self, serializer):
        user = self.request.user

        if not user.is_authenticated or user.role != "instructor":
            raise PermissionDenied(
                "Only instructors can create courses."
            )

        serializer.save(instructor=user)


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsInstructorOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        user = self.request.user

        queryset = Course.objects.select_related(
            "category",
            "instructor",
        ).annotate(
            lesson_count=Count("lessons")
        ).order_by("title", "id").prefetch_related("lessons")

        if user.is_authenticated and user.role == "instructor":
            return queryset.filter(
                Q(is_published=True) | Q(instructor=user)
            )

        return queryset.filter(is_published=True)

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CourseWriteSerializer

        return CourseDetailSerializer

    def perform_update(self, serializer):
        serializer.save(instructor=self.get_object().instructor)


class CourseEnrollmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        user = request.user

        if not user.is_active or user.role != "student":
            raise PermissionDenied(
                "Only active students can enroll in courses."
            )

        course = get_object_or_404(
            Course,
            slug=slug,
            is_published=True,
        )

        enrollment, created = Enrollment.objects.get_or_create(
            student=user,
            course=course,
        )

        if not created:
            return Response(
                {"detail": "You are already enrolled in this course."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = EnrollmentSerializer(enrollment)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if not user.is_active or user.role != "student":
            raise PermissionDenied(
                "Only active students can view their enrollments."
            )

        return Enrollment.objects.filter(
            student=user,
        ).select_related("course").order_by("-enrolled_at", "-id")
