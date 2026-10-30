import "./globals.css";

export const metadata = {
  title: {
    default: "Learnova | آکادمی یادگیری",
    template: "%s | Learnova",
  },
  description: "سامانه مدیریت و یادگیری دوره‌های آموزشی Learnova",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
