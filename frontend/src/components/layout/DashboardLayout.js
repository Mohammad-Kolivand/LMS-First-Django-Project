"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { clearTokens } from "@/lib/api";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({
  role = "student",
  title,
  userName = "کاربر",
  children,
  onSearch,
  searchValue = "",
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className={styles.main}>
        <Topbar
          title={title}
          userName={userName}
          onMenuClick={() => setSidebarOpen(true)}
          onSearch={onSearch}
          searchValue={searchValue}
        />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
