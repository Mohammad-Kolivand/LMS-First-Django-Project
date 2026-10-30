"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import CourseCard from "@/components/courses/CourseCard";
import { api, ApiError } from "@/lib/api";
import styles from "./StudentDashboard.module.css";

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "برای مشاهده اطلاعات این بخش باید وارد حساب کاربری‌ات شوی.";
    }

    return error.message;
  }

  return "دریافت اطلاعات ناموفق بود. دوباره تلاش کن.";
}

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState("loading");
  const [coursesStatus, setCoursesStatus] = useState("loading");
  const [enrollmentError, setEnrollmentError] = useState("");
  const [coursesError, setCoursesError] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadDashboard = useCallback(async () => {
    const [enrollmentResult, coursesResult] = await Promise.allSettled([
      api.get("courses/my-enrollments/"),
      api.get("courses/"),
    ]);

    if (enrollmentResult.status === "fulfilled") {
      setEnrollments(asList(enrollmentResult.value));
      setEnrollmentStatus("success");
    } else {
      setEnrollmentError(getErrorMessage(enrollmentResult.reason));
      setEnrollmentStatus("error");
    }

    if (coursesResult.status === "fulfilled") {
      setCourses(asList(coursesResult.value));
      setCoursesStatus("success");
    } else {
      setCoursesError(getErrorMessage(coursesResult.reason));
      setCoursesStatus("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        loadDashboard();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadDashboard, reloadKey]);

  const enrolledCourses = enrollments.map((item) => item?.course || item);

  const enrolledIds = new Set(
    enrolledCourses
      .map((course) => course?.id)
      .filter((id) => id !== undefined && id !== null),
  );

  const enrolledSlugs = new Set(
    enrolledCourses.map((course) => course?.slug).filter(Boolean),
  );

  const availableCourses = courses.filter(
    (course) =>
      !enrolledIds.has(course?.id) && !enrolledSlugs.has(course?.slug),
  );

  const normalizedSearch = search.trim().toLocaleLowerCase("fa");

  const filteredEnrollments = enrolledCourses.filter((course) =>
    String(course?.title || "")
      .toLocaleLowerCase("fa")
      .includes(normalizedSearch),
  );

  const filteredAvailableCourses = availableCourses.filter((course) =>
    String(course?.title || "")
      .toLocaleLowerCase("fa")
      .includes(normalizedSearch),
  );

  return (
    <DashboardLayout
      role="student"
      title="داشبورد دانشجو"
      userName="دانشجو"
      onSearch={setSearch}
      searchValue={search}
    >
      <section className={styles.welcome}>
        <div className={styles.welcomeContent}>
          <span className={styles.eyebrow}>
            <GraduationCap size={17} />
            فضای یادگیری تو
          </span>
          <h2>به مسیر یادگیریت خوش اومدی</h2>
          <p>
            دوره‌هات رو دنبال کن، مطالب جدید رو پیدا کن و قدم‌به‌قدم پیش برو.
          </p>
        </div>

        <div className={styles.welcomeIcon} aria-hidden="true">
          <BookOpen size={42} strokeWidth={1.4} />
        </div>
      </section>

      <section className={styles.stats} aria-label="خلاصه وضعیت">
        <StatCard
          title="دوره‌های ثبت‌نام‌شده"
          value={enrollmentStatus === "success" ? enrollments.length : "—"}
          description={
            enrollmentStatus === "success"
              ? "بر اساس ثبت‌نام‌های حساب تو"
              : "پس از دریافت اطلاعات نمایش داده می‌شود"
          }
          icon={BookOpen}
          tone="teal"
        />

        <StatCard
          title="دوره‌های قابل مشاهده"
          value={coursesStatus === "success" ? courses.length : "—"}
          description={
            coursesStatus === "success"
              ? "دوره‌های برگشتی از سرور"
              : "پس از دریافت اطلاعات نمایش داده می‌شود"
          }
          icon={GraduationCap}
          tone="blue"
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>MY LEARNING</span>
            <h2>دوره‌های من</h2>
            <p>دوره‌هایی که در آن‌ها ثبت‌نام کرده‌ای.</p>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => setReloadKey((current) => current + 1)}
            disabled={
              enrollmentStatus === "loading" || coursesStatus === "loading"
            }
          >
            <RefreshCw size={16} />
            به‌روزرسانی
          </button>
        </div>

        {enrollmentStatus === "loading" ? (
          <LoadingState label="در حال دریافت ثبت‌نام‌های تو..." />
        ) : enrollmentStatus === "error" ? (
          <EmptyState
            title="دریافت دوره‌ها ناموفق بود"
            description={enrollmentError}
            icon={BookOpen}
            action={
              <div className={styles.errorActions}>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={() => setReloadKey((current) => current + 1)}
                >
                  تلاش دوباره
                </button>
                <Link href="/login" className={styles.loginLink}>
                  ورود به حساب
                </Link>
              </div>
            }
          />
        ) : filteredEnrollments.length === 0 ? (
          <EmptyState
            title={search ? "دوره‌ای با این عنوان پیدا نشد" : "هنوز در دوره‌ای ثبت‌نام نکرده‌ای"}
            description={
              search
                ? "عبارت جست‌وجو را تغییر بده و دوباره امتحان کن."
                : "از بین دوره‌های موجود، موضوع مورد علاقه‌ات را انتخاب کن."
            }
            icon={BookOpen}
            action={
              !search ? (
                <Link href="/courses" className={styles.browseButton}>
                  مشاهده دوره‌ها
                  <ArrowLeft size={16} />
                </Link>
              ) : null
            }
          />
        ) : (
          <div className={styles.courseGrid}>
            {filteredEnrollments.map((course, index) => (
              <CourseCard
                key={course?.id ?? course?.slug ?? `enrollment-${index}`}
                course={course}
                enrolled
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>EXPLORE COURSES</span>
            <h2>دوره‌های دیگر</h2>
            <p>دوره‌های موجودی که هنوز در آن‌ها ثبت‌نام نکرده‌ای.</p>
          </div>

          <Link href="/courses" className={styles.textLink}>
            همه دوره‌ها
            <ArrowLeft size={16} />
          </Link>
        </div>

        {coursesStatus === "loading" ? (
          <LoadingState label="در حال دریافت فهرست دوره‌ها..." />
        ) : coursesStatus === "error" ? (
          <EmptyState
            title="فهرست دوره‌ها بارگذاری نشد"
            description={coursesError}
            icon={GraduationCap}
            action={
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => setReloadKey((current) => current + 1)}
              >
                تلاش دوباره
              </button>
            }
          />
        ) : filteredAvailableCourses.length === 0 ? (
          <EmptyState
            title={search ? "دوره‌ای پیدا نشد" : "دوره جدیدی برای نمایش نیست"}
            description={
              search
                ? "عبارت جست‌وجو را تغییر بده."
                : "در حال حاضر دوره دیگری در پاسخ سرور موجود نیست."
            }
            icon={GraduationCap}
          />
        ) : (
          <div className={styles.courseGrid}>
            {filteredAvailableCourses.slice(0, 6).map((course, index) => (
              <CourseCard
                key={course?.id ?? course?.slug ?? `course-${index}`}
                course={course}
              />
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
