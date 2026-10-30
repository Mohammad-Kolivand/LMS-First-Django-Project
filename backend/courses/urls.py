from django.urls import path

from .lesson_views import (
    CourseLessonDetailView,
    CourseLessonListCreateView,
)
from .views import (
    CategoryListView,
    CourseDetailView,
    CourseEnrollmentView,
    CourseListCreateView,
    MyEnrollmentsView,
)
from .progress_views import LessonCompleteView, MyProgressView


app_name = "courses"

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("", CourseListCreateView.as_view(), name="course-list-create"),
    path("my-enrollments/", MyEnrollmentsView.as_view(), name="my-enrollments"),
    path(
        "<slug:slug>/lessons/",
        CourseLessonListCreateView.as_view(),
        name="lesson-list-create",
    ),
    path(
        "<slug:slug>/lessons/<int:lesson_id>/",
        CourseLessonDetailView.as_view(),
        name="lesson-detail",
    ),
    path(
        "<slug:slug>/enroll/",
        CourseEnrollmentView.as_view(),
        name="course-enroll",
    ),
    path("<slug:slug>/", CourseDetailView.as_view(), name="course-detail"),
]
