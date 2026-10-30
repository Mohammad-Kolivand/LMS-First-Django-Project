"use client";

import { Bell, Menu, Search } from "lucide-react";
import styles from "./Topbar.module.css";

export default function Topbar({
  title = "داشبورد",
  userName = "کاربر",
  onMenuClick,
  onSearch,
  searchValue = "",
}) {
  const initial = userName?.trim()?.charAt(0) || "ک";

  return (
    <header className={styles.topbar}>
      <div className={styles.heading}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={onMenuClick}
          aria-label="باز کردن منو"
        >
          <Menu size={22} />
        </button>

        <div>
          <span className={styles.breadcrumb}>فضای آموزشی / Learnova</span>
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>

      <div className={styles.actions}>
        <label className={styles.searchBox}>
          <Search size={17} />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearch?.(event.target.value)}
            placeholder="جست‌وجو..."
            aria-label="جست‌وجو"
          />
        </label>

        <button
          type="button"
          className={styles.notificationButton}
          aria-label="اعلان‌ها"
          title="اعلان‌ها"
          onClick={() => window.alert("بخش اعلان‌ها هنوز به سرور متصل نشده است.")}
        >
          <Bell size={19} />
        </button>

        <div className={styles.profile}>
          <span className={styles.avatar}>{initial}</span>
          <span className={styles.profileName}>{userName}</span>
        </div>
      </div>
    </header>
  );
}
