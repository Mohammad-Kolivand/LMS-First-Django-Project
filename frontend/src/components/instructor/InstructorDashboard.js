"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CircleAlert,
  GraduationCap,
  Plus,
  RefreshCw,
  Send,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import CourseCard from "@/components/courses/CourseCard";
import { api, ApiError } from "@/lib/api";
import styles from "./InstructorDashboard.module.css";

const initialForm = {
  title: "",
  slug: "",
  category: "",
  description: "",
  level: "beginner",
  is_published: false,
};

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function errorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "برای استفاده از پنل مدرس باید ابتدا وارد حساب کاربری شوی.";
    }

    if (error.status === 403) {
      return "حساب فعلی اجازه دسترسی به این بخش را ندارد.";
    }

    if (error.data && typeof error.data === "object") {
      const messages = Object.entries(error.data)
        .map(([key, value]) => {
          const detail = Array.isArray(value) ? value.join("، ") : value;
          return typeof detail === "string" ? `${key}: ${detail}` : "";
        })
        .filter(Boolean);

      if (messages.length) return messages.join(" — ");
    }

    return error.message;
  }

  return "در ارتباط با سرور خطایی رخ داد. دوباره تلاش کن.";
}

export default function InstructorDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadDashboard = useCallback(async () => {
    const [userResult, coursesResult, categoriesResult] =
      await Promise.allSettled([
        api.get("auth/me/"),
        api.get("courses/"),
        api.get("courses/categories/", { auth: false }),
      ]);

    if (userResult.status === "fulfilled") {
      setUser(userResult.value);
    }

    if (coursesResult.status === "fulfilled") {
      setCourses(asList(coursesResult.value));
    } else {
      setError(errorMessage(coursesResult.reason));
    }

    if (categoriesResult.status === "fulfilled") {
      setCategories(asList(categoriesResult.value));
    } else {
      setCategoryError(errorMessage(categoriesResult.reason));
    }

    if (
      userResult.status === "rejected" ||
      coursesResult.status === "rejected"
    ) {
      setStatus("error");
      if (userResult.status === "rejected") {
        setError(errorMessage(userResult.reason));
      }
    } else {
      setStatus("success");
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

  const normalizedSearch = search.trim().toLocaleLowerCase("fa");
  const filteredCourses = courses.filter((course) =>
    String(course?.title || "")
      .toLocaleLowerCase("fa")
      .includes(normalizedSearch),
  );

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreateCourse(event) {
    event.preventDefault();
    setFormError("");
    setNotice("");

    if (!form.title.trim() || !form.slug.trim() || !form.category) {
      setFormError("عنوان، شناسه انگلیسی دوره و دسته‌بندی را تکمیل کن.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim().toLowerCase(),
        category: Number(form.category),
        description: form.description.trim(),
        level: form.level,
        is_published: form.is_published,
      };

      await api.post("courses/", payload);

      setForm(initialForm);
      setShowForm(false);
      setNotice("درخواست ایجاد دوره با موفقیت ثبت شد.");
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setFormError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  const isInstructor = user?.role === "instructor";
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "مدرس";

  return (
    <DashboardLayout
      role="instructor"
      title="داشبورد مدرس"
      userName={displayName}
      onSearch={setSearch}
      searchValue={search}
    >
      <section className={styles.welcome}>
        <div>
          <span className={styles.eyebrow}>
            <GraduationCap size={17} />
            فضای تدریس
          </span>
          <h2>سلام {displayName}، آماده‌ای آموزش بدی؟</h2>
          <p>
            دوره‌هایت را مدیریت کن و محتوای آموزشی تازه‌ای برای یادگیرنده‌ها
            آماده کن.
          </p>
        </div>
        <span className={styles.welcomeIcon} aria-hidden="true">
          <BookOpen size={40} strokeWidth={1.5} />
        </span>
      </section>

      {status === "loading" ? (
        <LoadingState label="در حال دریافت اطلاعات حساب و دوره‌ها..." />
      ) : status === "error" ? (
        <section className={styles.statusPanel}>
          <EmptyState
            title="بارگذاری پنل مدرس ناموفق بود"
            description={error}
            icon={CircleAlert}
            action={
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                تلاش دوباره
                <RefreshCw size={16} />
              </button>
            }
          />
        </section>
      ) : !isInstructor ? (
        <section className={styles.statusPanel}>
          <EmptyState
            title="دسترسی مدرس تأیید نشد"
            description="این حساب کاربری در پاسخ سرور به‌عنوان مدرس شناخته نشده است. با حساب مدرس وارد شو."
            icon={GraduationCap}
          />
        </section>
      ) : (
        <>
          <section className={styles.stats} aria-label="خلاصه دوره‌ها">
            <StatCard
              title="دوره‌های برگشتی از سرور"
              value={courses.length}
              description="تعداد دوره‌های قابل مشاهده در API"
              icon={BookOpen}
              tone="teal"
            />
            <StatCard
              title="دسته‌بندی‌های موجود"
              value={categories.length}
              description="دسته‌بندی‌های دریافت‌شده از بک‌اند"
              icon={GraduationCap}
              tone="blue"
            />
          </section>

          {notice && (
            <p className={styles.successNotice} role="status">
              {notice}
            </p>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionEyebrow}>COURSE MANAGEMENT</span>
                <h2>مدیریت دوره‌ها</h2>
                <p>
                  فهرست دوره‌های قابل مشاهده برای این حساب؛ مالکیت هر دوره باید
                  از پاسخ سرور مشخص شود.
                </p>
              </div>

              <div className={styles.headingActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setReloadKey((current) => current + 1)}
                >
                  <RefreshCw size={15} />
                  به‌روزرسانی
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setShowForm((current) => !current);
                    setFormError("");
                  }}
                >
                  <Plus size={17} />
                  ایجاد دوره
                </button>
              </div>
            </div>

            {showForm && (
              <form className={styles.form} onSubmit={handleCreateCourse}>
                <div className={styles.formHeading}>
                  <h3>اطلاعات دوره جدید</h3>
                  <p>اطلاعات را وارد کن؛ ثبت نهایی توسط API انجام می‌شود.</p>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>عنوان دوره *</span>
                    <input
                      name="title"
                      value={form.title}
                      onChange={updateField}
                      placeholder="مثلاً آموزش مقدماتی پایتون"
                      maxLength={200}
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span>شناسه انگلیسی (Slug) *</span>
                    <input
                      name="slug"
                      value={form.slug}
                      onChange={updateField}
                      placeholder="python-basics"
                      pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*"
                      title="فقط حروف انگلیسی، عدد و خط تیره استفاده کن."
                      required
                    />
                  </label>

                  <label className={styles.field}>
                    <span>دسته‌بندی *</span>
                    <select
                      name="category"
                      value={form.category}
                      onChange={updateField}
                      required
                    >
                      <option value="">انتخاب دسته‌بندی</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>سطح دوره</span>
                    <select
                      name="level"
                      value={form.level}
                      onChange={updateField}
                    >
                      <option value="beginner">مقدماتی</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">پیشرفته</option>
                    </select>
                  </label>

                  <label className={`${styles.field} ${styles.fullWidth}`}>
                    <span>توضیحات دوره</span>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={updateField}
                      placeholder="موضوعات و هدف این دوره را توضیح بده..."
                      rows={4}
                    />
                  </label>
                </div>

                <label className={styles.checkboxField}>
                  <input
                    type="checkbox"
                    name="is_published"
                    checked={form.is_published}
                    onChange={updateField}
                  />
                  <span>انتشار دوره پس از ایجاد</span>
                </label>

                {categoryError && (
                  <p className={styles.errorNotice} role="alert">
                    دریافت دسته‌بندی‌ها ناموفق بود: {categoryError}
                  </p>
                )}

                {categories.length === 0 && !categoryError && (
                  <p className={styles.helperNotice}>
                    برای ایجاد دوره، ابتدا باید حداقل یک دسته‌بندی در بک‌اند
                    وجود داشته باشد.
                  </p>
                )}

                {formError && (
                  <p className={styles.errorNotice} role="alert">
                    {formError}
                  </p>
                )}

                <div className={styles.formActions}>
                  <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={saving || categories.length === 0}
                  >
                    <Send size={16} />
                    {saving ? "در حال ثبت..." : "ثبت دوره"}
                  </button>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormError("");
                    }}
                    disabled={saving}
                  >
                    انصراف
                  </button>
                </div>
              </form>
            )}

            {filteredCourses.length === 0 ? (
              <EmptyState
                title={search ? "دوره‌ای با این عنوان پیدا نشد" : "دوره‌ای برای نمایش نیست"}
                description={
                  search
                    ? "عبارت جست‌وجو را تغییر بده."
                    : "می‌توانی از فرم بالا برای ایجاد یک دوره اقدام کنی."
                }
                icon={BookOpen}
              />
            ) : (
              <div className={styles.courseGrid}>
                {filteredCourses.map((course, index) => (
                  <CourseCard
                    key={course?.id ?? course?.slug ?? `course-${index}`}
                    course={course}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
