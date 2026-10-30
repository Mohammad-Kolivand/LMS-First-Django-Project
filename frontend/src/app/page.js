import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />

      <div className={styles.content}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="صفحه اصلی Learnova">
            <span className={styles.brandIcon}>
              <GraduationCap size={25} />
            </span>
            <span>
              <span className={styles.brandName}>learnova</span>
              <span className={styles.brandCaption}>LEARN DIFFERENTLY</span>
            </span>
          </Link>

          <Link href="/login" className={styles.headerLink}>
            ورود به حساب
            <ArrowUpLeft size={17} />
          </Link>
        </header>

        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              یادگیری، با ساختاری بهتر
            </div>

            <h1 className={styles.title}>
              برای رشدت
              <br />
              <span className={styles.titleAccent}>از همین‌جا شروع کن.</span>
            </h1>

            <p className={styles.description}>
              یک فضای منظم برای یادگیری، مدیریت دوره‌ها و دنبال‌کردن مسیر
              پیشرفتت. مهارت‌های جدید رو قدم‌به‌قدم یاد بگیر.
            </p>

            <div className={styles.actions}>
              <Link href="/login" className={styles.primaryButton}>
                ورود به Learnova
                <ArrowLeft size={18} />
              </Link>

              <Link href="/register" className={styles.secondaryButton}>
                ساخت حساب کاربری
                <ArrowUpLeft size={17} />
              </Link>
            </div>
          </div>

          <div className={styles.visual} aria-hidden="true">
            <div className={styles.visualOrb} />
            <div className={styles.visualIcon}>
              <BookOpen size={60} strokeWidth={1.4} />
            </div>

            <div className={styles.visualLabel}>
              <span className={styles.visualLabelIcon}>
                <Sparkles size={21} />
              </span>
              <span>
                <strong>مسیر یادگیری تو</strong>
                <small>از شروع تا پیشرفت</small>
              </span>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <span>Learnova — سامانه یادگیری آنلاین</span>
          <span>محیطی برای یادگیری هدفمند</span>
        </footer>
      </div>
    </main>
  );
}
