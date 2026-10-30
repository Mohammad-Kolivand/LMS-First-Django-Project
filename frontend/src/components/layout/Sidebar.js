"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  X,
} from "lucide-react";
import styles from "./Sidebar.module.css";

const menus = {
  student: [
    { label: "داشبورد", href: "/student", icon: LayoutDashboard },
    { label: "دوره‌های آموزشی", href: "/courses", icon: BookOpen },
  ],
  instructor: [
    { label: "داشبورد مدرس", href: "/instructor", icon: LayoutDashboard },
    { label: "دوره‌های آموزشی", href: "/courses", icon: BookOpen },
  ],
  admin: [
    { label: "داشبورد مدیریت", href: "/admin-dashboard", icon: LayoutDashboard },
    { label: "دوره‌های آموزشی", href: "/courses", icon: BookOpen },
  ],
};

const roleLabels = {
  student: "پنل دانشجو",
  instructor: "پنل مدرس",
  admin: "پنل مدیریت",
};

export default function Sidebar({
  role = "student",
  open = false,
  onClose,
  onLogout,
}) {
  const pathname = usePathname();
  const items = menus[role] || menus.student;

  return (
    <>
      {open && (
        <button
          className={styles.overlay}
          onClick={onClose}
          aria-label="بستن منو"
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>
            <GraduationCap size={25} />
          </span>
          <span className={styles.brandText}>
            <strong>learnova</strong>
            <small>LEARN DIFFERENTLY</small>
          </span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.workspace}>
          <span className={styles.workspaceIcon}>
            <BookOpen size={18} />
          </span>
          <span>
            <strong>فضای آموزشی</strong>
            <small>{roleLabels[role] || roleLabels.student}</small>
          </span>
        </div>

        <span className={styles.sectionLabel}>منوی اصلی</span>

        <nav className={styles.navigation} aria-label="منوی اصلی">
          {items.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/courses" && pathname.startsWith(`${href}/`)) ||
              (href === "/courses" && pathname.startsWith("/courses/"));

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`${styles.navLink} ${
                  active ? styles.navLinkActive : ""
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerNote}>
            <span className={styles.footerDot} />
            <span>
              <strong>Learnova</strong>
              <small>محیط یادگیری آنلاین</small>
            </span>
          </div>

          <button type="button" className={styles.logoutButton} onClick={onLogout}>
            <LogOut size={18} />
            خروج از حساب
          </button>
        </div>
      </aside>
    </>
  );
}
