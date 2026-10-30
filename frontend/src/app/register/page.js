"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, LockKeyhole, Mail, UserRound, UsersRound,
} from "lucide-react";
import { api } from "@/lib/api";
import styles from "../auth.module.css";

function errorMessage(error) {
  const data = error?.data;

  if (data && typeof data === "object") {
    const value = Object.values(data).flat().find(
      (item) => typeof item === "string",
    );
    if (value) return value;
  }

  return error?.message || "ثبت‌نام انجام نشد. اطلاعات را بررسی کنید.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    if (form.password !== form.password_confirm) {
      setError("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("auth/register/", form, { auth: false });
      router.push("/login");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <aside className={styles.brandPanel}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}><BookOpen size={23} /></span>
          learnova
        </Link>

        <div className={styles.brandText}>
          <span className={styles.eyebrow}>YOUR NEXT CHAPTER</span>
          <h1>هر مهارت تازه،<br />یک شروع تازه است.</h1>
          <p>حساب خودت رو بساز و یک مسیر روشن برای یادگیری مهارت‌های جدید داشته باش.</p>
          <div className={styles.features}>
            <div className={styles.feature}><span className={styles.featureMark}>۱</span>حساب شخصی خودت رو بساز</div>
            <div className={styles.feature}><span className={styles.featureMark}>۲</span>دوره‌های موردنظرت رو پیدا کن</div>
            <div className={styles.feature}><span className={styles.featureMark}>۳</span>پیشرفتت رو قدم‌به‌قدم دنبال کن</div>
          </div>
        </div>

        <div className={styles.brandFooter}>Learnova — شروع یادگیری از همین‌جا</div>
      </aside>

      <section className={styles.formPanel}>
        <div className={styles.formWrap}>
          <Link href="/" className={styles.mobileBrand}>
            <span className={styles.brandMark}><BookOpen size={22} /></span>
            learnova
          </Link>

          <header className={styles.formHeading}>
            <span className={styles.eyebrow}>به Learnova خوش اومدی</span>
            <h2>ساخت حساب کاربری</h2>
            <p>اطلاعاتت رو وارد کن تا یادگیری رو شروع کنیم.</p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="username">نام کاربری</label>
              <div className={styles.inputWrap}>
                <UserRound className={styles.inputIcon} />
                <input className={styles.input} id="username" name="username"
                  autoComplete="username" placeholder="یک نام کاربری انتخاب کن"
                  value={form.username} onChange={updateField} required />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="email">ایمیل</label>
              <div className={styles.inputWrap}>
                <Mail className={styles.inputIcon} />
                <input className={styles.input} id="email" name="email" type="email"
                  autoComplete="email" placeholder="you@example.com"
                  value={form.email} onChange={updateField} required />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="first_name">نام</label>
              <div className={styles.inputWrap}>
                <UsersRound className={styles.inputIcon} />
                <input className={styles.input} id="first_name" name="first_name"
                  autoComplete="given-name" placeholder="نامت"
                  value={form.first_name} onChange={updateField} required />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="last_name">نام خانوادگی</label>
              <div className={styles.inputWrap}>
                <UsersRound className={styles.inputIcon} />
                <input className={styles.input} id="last_name" name="last_name"
                  autoComplete="family-name" placeholder="نام خانوادگی‌ات"
                  value={form.last_name} onChange={updateField} required />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password">رمز عبور</label>
              <div className={styles.inputWrap}>
                <LockKeyhole className={styles.inputIcon} />
                <input className={styles.input} id="password" name="password"
                  type="password" autoComplete="new-password"
                  placeholder="یک رمز عبور امن انتخاب کن"
                  value={form.password} onChange={updateField} required />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password_confirm">تکرار رمز عبور</label>
              <div className={styles.inputWrap}>
                <LockKeyhole className={styles.inputIcon} />
                <input className={styles.input} id="password_confirm"
                  name="password_confirm" type="password" autoComplete="new-password"
                  placeholder="رمز عبورت رو دوباره وارد کن"
                  value={form.password_confirm} onChange={updateField} required />
              </div>
            </div>

            {error && <div className={styles.message} role="alert">{error}</div>}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? "در حال ساخت حساب..." : "ساخت حساب کاربری"}
              {!loading && <ArrowLeft size={18} />}
            </button>
          </form>

          <div className={styles.formSwitch}>
            قبلاً ثبت‌نام کردی؟
            <Link href="/login">وارد حساب شو</Link>
          </div>
          <Link href="/" className={styles.backHome}>بازگشت به صفحهٔ اصلی</Link>
        </div>
      </section>
    </main>
  );
}
