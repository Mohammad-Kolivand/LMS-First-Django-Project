import { Inbox } from "lucide-react";
import styles from "./EmptyState.module.css";

export default function EmptyState({
  title = "موردی پیدا نشد",
  description = "در حال حاضر اطلاعاتی برای نمایش وجود ندارد.",
  icon: Icon = Inbox,
  action,
}) {
  return (
    <section className={styles.state} aria-live="polite">
      <span className={styles.icon}>
        <Icon size={27} strokeWidth={1.6} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  );
}
