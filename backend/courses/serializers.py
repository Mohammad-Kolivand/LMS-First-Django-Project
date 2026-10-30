from rest_framework import serializers

from .models import Category, Course, Enrollment, Lesson


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description")


class LessonSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = (
            "id",
            "title",
            "content",
            "order",
            "duration_minutes",
            "is_free_preview",
        )

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Lesson title cannot be empty."
            )

        return value

    def validate_order(self, value):
        if value < 1:
            raise serializers.ValidationError(
                "Lesson order must be greater than zero."
            )

        return value

    def validate_duration_minutes(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Duration cannot be negative."
            )

        return value

    def validate(self, attrs):
        instance = self.instance

        course_id = (
            instance.course_id
            if instance is not None
            else getattr(self.context.get("course"), "id", None)
        )

        order = attrs.get(
            "order",
            instance.order if instance is not None else None,
        )

        if course_id is not None and order is not None:
            lessons = Lesson.objects.filter(
                course_id=course_id,
                order=order,
            )

            if instance is not None:
                lessons = lessons.exclude(pk=instance.pk)

            if lessons.exists():
                raise serializers.ValidationError({
                    "order": "This order is already used in this course."
                })

        return attrs

    def get_content(self, obj):
        if obj.is_free_preview:
            return obj.content

        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return None

        user = request.user

        if not user.is_active:
            return None

        if (
            user.role == "instructor"
            and obj.course.instructor_id == user.id
        ):
            return obj.content

        if user.role != "student":
            return None

        access_cache = self.context.setdefault(
            "_enrollment_access_cache", {}
        )
        course_id = obj.course_id

        if course_id not in access_cache:
            access_cache[course_id] = Enrollment.objects.filter(
                student_id=user.id,
                course_id=course_id,
            ).exists()

        return obj.content if access_cache[course_id] else None

class CourseListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    instructor_name = serializers.SerializerMethodField()
    lesson_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = (
            "id",
            "title",
            "slug",
            "description",
            "level",
            "category",
            "instructor_name",
            "lesson_count",
            "created_at",
            "updated_at",
        )

    def get_instructor_name(self, obj):
        full_name = obj.instructor.get_full_name().strip()
        return full_name or obj.instructor.username


class CourseDetailSerializer(CourseListSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ("lessons",)


class CourseWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = (
            "id",
            "category",
            "title",
            "slug",
            "description",
            "level",
            "is_published",
        )
        read_only_fields = ("id",)


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(
        source="course.title",
        read_only=True,
    )
    course_slug = serializers.CharField(
        source="course.slug",
        read_only=True,
    )

    class Meta:
        model = Enrollment
        fields = (
            "id",
            "course",
            "course_title",
            "course_slug",
            "enrolled_at",
        )
        read_only_fields = fields
