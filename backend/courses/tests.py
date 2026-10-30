from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Course, Enrollment, Lesson

User = get_user_model()


class CourseAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.instructor = User.objects.create_user(
            username="instructor",
            password="StrongPass!2026",
            role="instructor",
            first_name="Test",
            last_name="Instructor",
        )
        cls.other_instructor = User.objects.create_user(
            username="other-instructor",
            password="StrongPass!2026",
            role="instructor",
        )
        cls.student = User.objects.create_user(
            username="student",
            password="StrongPass!2026",
            role="student",
        )

        cls.category = Category.objects.create(
            name="Programming",
            slug="programming",
            description="Programming courses",
        )
        cls.other_category = Category.objects.create(
            name="Design",
            slug="design",
            description="Design courses",
        )

        cls.published_course = Course.objects.create(
            instructor=cls.instructor,
            category=cls.category,
            title="Published Python",
            slug="published-python",
            description="Learn Python programming",
            level=Course.Level.BEGINNER,
            is_published=True,
        )
        cls.draft_course = Course.objects.create(
            instructor=cls.instructor,
            category=cls.category,
            title="Draft Django",
            slug="draft-django",
            description="Learn Django backend",
            level=Course.Level.INTERMEDIATE,
            is_published=False,
        )
        cls.other_course = Course.objects.create(
            instructor=cls.other_instructor,
            category=cls.other_category,
            title="Published Design",
            slug="published-design",
            description="Learn interface design",
            level=Course.Level.ADVANCED,
            is_published=True,
        )
        cls.other_draft_course = Course.objects.create(
            instructor=cls.other_instructor,
            category=cls.other_category,
            title="Private Draft",
            slug="other-private-draft",
            description="An unpublished course",
            level=Course.Level.BEGINNER,
            is_published=False,
        )

        Lesson.objects.create(
            course=cls.published_course,
            title="Free introduction",
            content="This content is public.",
            order=1,
            duration_minutes=5,
            is_free_preview=True,
        )
        Lesson.objects.create(
            course=cls.published_course,
            title="Premium lesson",
            content="This content must not be public.",
            order=2,
            duration_minutes=20,
            is_free_preview=False,
        )

    def test_anonymous_user_sees_only_published_courses(self):
        response = self.client.get(reverse("courses:course-list-create"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        slugs = {course["slug"] for course in results}
        self.assertEqual(
            slugs,
            {"published-python", "published-design"},
        )

    def test_student_cannot_create_course(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            reverse("courses:course-list-create"),
            {
                "category": self.category.id,
                "title": "Unauthorized course",
                "slug": "unauthorized-course",
                "description": "Should not be created",
                "level": "beginner",
                "is_published": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            Course.objects.filter(slug="unauthorized-course").exists()
        )

    def test_instructor_can_create_own_course(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.post(
            reverse("courses:course-list-create"),
            {
                "category": self.category.id,
                "title": "New Python Course",
                "slug": "new-python-course",
                "description": "A new course",
                "level": "beginner",
                "is_published": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        course = Course.objects.get(slug="new-python-course")
        self.assertEqual(course.instructor, self.instructor)

    def test_instructor_cannot_update_another_instructors_course(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.patch(
            reverse(
                "courses:course-detail",
                kwargs={"slug": "published-design"},
            ),
            {"title": "Hijacked title"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.other_course.refresh_from_db()
        self.assertEqual(self.other_course.title, "Published Design")

    def test_public_course_detail_hides_paid_lesson_content(self):
        response = self.client.get(
            reverse(
                "courses:course-detail",
                kwargs={"slug": "published-python"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lessons = response.data["lessons"]
        self.assertEqual(lessons[0]["content"], "This content is public.")
        self.assertIsNone(lessons[1]["content"])

    def test_course_filters_work(self):
        response = self.client.get(
            reverse("courses:course-list-create"),
            {
                "category": "programming",
                "level": "beginner",
                "search": "Python",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["slug"], "published-python")

    def test_instructor_sees_own_draft_but_not_other_instructors_draft(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(reverse("courses:course-list-create"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = {course["slug"] for course in response.data["results"]}
        self.assertIn("draft-django", slugs)
        self.assertIn("published-python", slugs)
        self.assertIn("published-design", slugs)
        self.assertNotIn("other-private-draft", slugs)

    def test_student_can_enroll_in_published_course(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            reverse(
                "courses:course-enroll",
                kwargs={"slug": "published-python"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Enrollment.objects.filter(
                student=self.student,
                course=self.published_course,
            ).count(),
            1,
        )

    def test_student_cannot_enroll_twice_in_same_course(self):
        self.client.force_authenticate(user=self.student)
        url = reverse(
            "courses:course-enroll",
            kwargs={"slug": "published-python"},
        )

        first_response = self.client.post(url)
        second_response = self.client.post(url)

        self.assertEqual(
            first_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            second_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            Enrollment.objects.filter(
                student=self.student,
                course=self.published_course,
            ).count(),
            1,
        )

    def test_instructor_cannot_enroll_in_course(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.post(
            reverse(
                "courses:course-enroll",
                kwargs={"slug": "published-python"},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertFalse(
            Enrollment.objects.filter(
                student=self.instructor,
                course=self.published_course,
            ).exists()
        )

    def test_student_cannot_enroll_in_unpublished_course(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            reverse(
                "courses:course-enroll",
                kwargs={"slug": "draft-django"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(
            Enrollment.objects.filter(
                student=self.student,
                course=self.draft_course,
            ).exists()
        )

    def test_student_sees_only_their_own_enrollments(self):
        another_student = User.objects.create_user(
            username="another-student",
            password="StrongPass!2026",
            role="student",
        )
        Enrollment.objects.create(
            student=self.student,
            course=self.published_course,
        )
        Enrollment.objects.create(
            student=another_student,
            course=self.other_course,
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.get(
            reverse("courses:my-enrollments")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["course_slug"], "published-python")

    def test_enrolled_student_can_read_paid_lesson_content(self):
        Enrollment.objects.create(
            student=self.student,
            course=self.published_course,
        )
        self.client.force_authenticate(user=self.student)

        response = self.client.get(
            reverse(
                "courses:course-detail",
                kwargs={"slug": "published-python"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lessons = response.data["lessons"]
        self.assertEqual(
            lessons[1]["content"],
            "This content must not be public.",
        )

    def test_unenrolled_student_cannot_read_paid_lesson(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(
            reverse(
                "courses:course-detail",
                kwargs={"slug": "published-python"},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["lessons"][1]["content"])

    def test_inactive_student_cannot_enroll(self):
        self.student.is_active = False
        self.student.save(update_fields=["is_active"])
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            reverse(
                "courses:course-enroll",
                kwargs={"slug": "published-python"},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertFalse(
            Enrollment.objects.filter(
                student=self.student,
                course=self.published_course,
            ).exists()
        )

    def test_inactive_student_cannot_list_enrollments(self):
        self.student.is_active = False
        self.student.save(update_fields=["is_active"])
        self.client.force_authenticate(user=self.student)

        response = self.client.get(
            reverse("courses:my-enrollments")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )
    def test_anonymous_user_cannot_access_draft_course_lessons(self):
        response = self.client.get(
            reverse(
                "courses:lesson-list-create",
                kwargs={"slug": "draft-django"},
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_anonymous_user_cannot_enroll(self):
        response = self.client.post(
            reverse(
                "courses:course-enroll",
                kwargs={"slug": "published-python"},
            )
        )

        self.assertIn(
            response.status_code,
            (
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ),
        )



class LessonAPITests(CourseAPITests):
    def lesson_list_url(self, slug="published-python"):
        return reverse(
            "courses:lesson-list-create",
            kwargs={"slug": slug},
        )

    def lesson_detail_url(self, lesson, slug=None):
        return reverse(
            "courses:lesson-detail",
            kwargs={
                "slug": slug or lesson.course.slug,
                "lesson_id": lesson.id,
            },
        )

    def test_anonymous_user_can_list_published_course_lessons(self):
        response = self.client.get(self.lesson_list_url())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)
        self.assertEqual(
            response.data["results"][1]["content"],
            None,
        )

    def test_enrolled_student_can_read_paid_lesson_detail(self):
        Enrollment.objects.create(
            student=self.student,
            course=self.published_course,
        )
        lesson = self.published_course.lessons.get(order=2)
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.lesson_detail_url(lesson))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["content"],
            "This content must not be public.",
        )

    def test_instructor_can_create_lesson_in_own_course(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.post(
            self.lesson_list_url("draft-django"),
            {
                "title": "Django Models",
                "content": "Learn Django models.",
                "order": 1,
                "duration_minutes": 15,
                "is_free_preview": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lesson = Lesson.objects.get(title="Django Models")
        self.assertEqual(lesson.course, self.draft_course)

    def test_student_cannot_create_lesson(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            self.lesson_list_url(),
            {
                "title": "Unauthorized lesson",
                "content": "Should not be saved.",
                "order": 3,
                "duration_minutes": 10,
                "is_free_preview": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            Lesson.objects.filter(title="Unauthorized lesson").exists()
        )

    def test_instructor_cannot_modify_another_instructors_lesson(self):
        lesson = self.other_course.lessons.create(
            title="Other instructor lesson",
            content="Private course material.",
            order=1,
        )
        self.client.force_authenticate(user=self.instructor)

        response = self.client.patch(
            self.lesson_detail_url(lesson),
            {"title": "Modified title"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        lesson.refresh_from_db()
        self.assertEqual(lesson.title, "Other instructor lesson")

    def test_instructor_cannot_read_another_instructors_draft_lesson(self):
        lesson = self.other_draft_course.lessons.create(
            title="Private draft lesson",
            content="Confidential draft content.",
            order=1,
        )
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.lesson_detail_url(lesson))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_instructor_can_update_and_delete_own_lesson(self):
        lesson = self.published_course.lessons.get(order=1)
        self.client.force_authenticate(user=self.instructor)

        update_response = self.client.patch(
            self.lesson_detail_url(lesson),
            {"title": "Updated introduction"},
            format="json",
        )

        self.assertEqual(
            update_response.status_code,
            status.HTTP_200_OK,
        )
        lesson.refresh_from_db()
        self.assertEqual(lesson.title, "Updated introduction")

        delete_response = self.client.delete(
            self.lesson_detail_url(lesson),
        )

        self.assertEqual(
            delete_response.status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertFalse(Lesson.objects.filter(pk=lesson.pk).exists())


class LessonValidationAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.instructor = User.objects.create_user(
            username="validation-instructor",
            password="StrongPass!2026",
            role="instructor",
        )

        cls.category = Category.objects.create(
            name="Validation",
            slug="validation",
        )

        cls.published_course = Course.objects.create(
            instructor=cls.instructor,
            category=cls.category,
            title="Validation Course",
            slug="published-python",
            description="Course for validation tests",
            is_published=True,
        )

        Lesson.objects.create(
            course=cls.published_course,
            title="Existing lesson",
            content="Existing lesson content",
            order=1,
            duration_minutes=5,
            is_free_preview=False,
        )
    def setUp(self):
        self.client.force_authenticate(user=self.instructor)
        self.url = reverse(
            "courses:lesson-list-create",
            kwargs={"slug": "published-python"},
        )

    def test_lesson_title_cannot_be_blank(self):
        response = self.client.post(
            self.url,
            {
                "title": "   ",
                "content": "Some content",
                "order": 3,
                "duration_minutes": 10,
                "is_free_preview": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_lesson_order_must_be_positive(self):
        response = self.client.post(
            self.url,
            {
                "title": "Invalid order",
                "content": "Some content",
                "order": 0,
                "duration_minutes": 10,
                "is_free_preview": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_lesson_order_cannot_be_duplicated(self):
        response = self.client.post(
            self.url,
            {
                "title": "Duplicate order",
                "content": "Some content",
                "order": 1,
                "duration_minutes": 10,
                "is_free_preview": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(
            Lesson.objects.filter(title="Duplicate order").exists()
        )

    def test_lesson_title_is_trimmed(self):
        response = self.client.post(
            self.url,
            {
                "title": "  New lesson  ",
                "content": "Some content",
                "order": 3,
                "duration_minutes": 10,
                "is_free_preview": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Lesson.objects.filter(title="New lesson").exists()
        )
