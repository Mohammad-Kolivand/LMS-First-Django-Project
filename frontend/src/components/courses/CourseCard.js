import Link from "next/link";
import { ArrowLeft, BookOpen, Clock3, GraduationCap } from "lucide-react";
import styles from "./CourseCard.module.css";

const levelLabels = {
  beginner: "مقدماتی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

export default function CourseCard({ course, enrolled = false }) {
  const title = course?.title || "دوره بدون عنوان";
  const slug = course?.slug;
  const category =
    typeof course?.category === "string"
      ? course.category
      : course?.category?.name;
  const instructor =
    course?.instructor_name ||
    course?.instructor?.full_name ||
    course?.instructor?.username;
  const level = levelLabels[course?.level] || "سطح نامشخص";
  const lessonCount =
    typeof course?.lesson_count === "number" ? course.lesson_count : null;

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.courseIcon}>
          <BookOpen size={22} strokeWidth={1.7} />
        </span>
        <span className={styles.level}>{level}</span>
      </div>

      <div className={styles.content}>
        {category && <span className={styles.category}>{category}</span>}

        <h3 className={styles.title}>{title}</h3>

        <p className={styles.description}>
          {course?.description?.trim() ||
            "برای مشاهده جزئیات و محتوای آموزشی این دوره وارد صفحه آن شوید."}
        </p>

        <div className={styles.metadata}>
          {instructor && (
            <span>
              <GraduationCap size={15} />
              {instructor}
            </span>
          )}

          {lessonCount !== null && (
            <span>
              <Clock3 size={15} />
              {lessonCount} درس
            </span>
          )}
        </div>
      </div>

      {slug ? (
        <Link
          href={`/courses/${encodeURIComponent(slug)}`}
          className={styles.action}
        >
          {enrolled ? "ادامه یادگیری" : "مشاهده دوره"}
          <ArrowLeft size={17} />
        </Link>
      ) : (
        <span className={styles.unavailable}>
          لینک این دوره در دسترس نیست
        </span>
      )}
    </article>
  );
}
