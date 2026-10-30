"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Check, LockKeyhole, UserRound } from "lucide-react";
import { api, saveTokens, clearTokens } from "@/lib/api";
import styles from "../auth.module.css";

function errorMessage(error) {
  const data = error?.data;

  if (data && typeof data === "object") {
    const value = Object.values(data).flat().find(
      (item) => typeof item === "string",
    );
    if (value) return value;
  }

  if (error?.status === 401) {
    return "نام کاربری یا رمز عبور صحیح نیست.";
  }

  return error?.message || "ورود انجام نشد. دوباره تلاش کنید.";
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const tokens = await api.post(
        "auth/token/",
        { username: username.trim(), password },
        { auth: false },
      );

      if (!tokens?.access || !tokens?.refresh) {
        throw new Error("پاسخ ورود از سرور معتبر نیست.");
      }

      saveTokens(tokens);

      try {
        const user = await api.get("auth/me/");
        router.replace(user.role === "instructor" ? "/instructor" : "/student");
      } catch (requestError) {
        clearTokens();
        setError(errorMessage(requestError));
      }
    } catch (requestError) {
      clearTokens();
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
          <span className={styles.eyebrow}>LEARN DIFFERENTLY</span>
          <h1>مسیر یادگیریت رو<br />از همین‌جا ادامه بده.</h1>
          <p>به فضای یادگیری خودت برگرد؛ دوره‌هات رو دنبال کن و قدم‌به‌قدم پیشرفت کن.</p>
          <div className={styles.features}>
            <div className={styles.feature}><span className={styles.featureMark}><Check size={15} /></span>دوره‌ها و مسیر یادگیری منظم</div>
            <div className={styles.feature}><span className={styles.featureMark}><Check size={15} /></span>پیگیری پیشرفت در یک فضای یکپارچه</div>
            <div className={styles.feature}><span className={styles.featureMark}><Check size={15} /></span>دسترسی به حساب شخصی خودت</div>
          </div>
        </div>

        <div className={styles.brandFooter}>Learnova — یادگیری هدفمند، قدم‌به‌قدم</div>
      </aside>

      <section className={styles.formPanel}>
        <div className={styles.formWrap}>
          <Link href="/" className={styles.mobileBrand}>
            <span className={styles.brandMark}><BookOpen size={22} /></span>
            learnova
          </Link>

          <header className={styles.formHeading}>
            <span className={styles.eyebrow}>خوش برگشتی!</span>
            <h2>ورود به حساب</h2>
            <p>برای ادامهٔ مسیر یادگیری، اطلاعات حسابت رو وارد کن.</p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="username">نام کاربری</label>
              <div className={styles.inputWrap}>
                <UserRound className={styles.inputIcon} />
                <input
                  className={styles.input}
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="نام کاربری‌ات رو وارد کن"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="password">رمز عبور</label>
              <div className={styles.inputWrap}>
                <LockKeyhole className={styles.inputIcon} />
                <input
                  className={styles.input}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="رمز عبورت رو وارد کن"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            {error && <div className={styles.message} role="alert">{error}</div>}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? "در حال ورود..." : "ورود به حساب"}
              {!loading && <ArrowLeft size={18} />}
            </button>
          </form>

          <div className={styles.formSwitch}>
            هنوز حساب نداری؟
            <Link href="/register">ساخت حساب کاربری</Link>
          </div>
          <Link href="/" className={styles.backHome}>بازگشت به صفحهٔ اصلی</Link>
        </div>
      </section>
    </main>
  );
}
