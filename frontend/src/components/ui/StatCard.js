import styles from "./StatCard.module.css";

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "teal",
}) {
  return (
    <article className={styles.card}>
      <div className={`${styles.icon} ${styles[tone] || styles.teal}`}>
        {Icon ? <Icon size={21} strokeWidth={1.8} /> : null}
      </div>

      <div className={styles.details}>
        <span className={styles.title}>{title}</span>
        <strong className={styles.value}>{value}</strong>
        {description ? (
          <span className={styles.description}>{description}</span>
        ) : null}
      </div>
    </article>
  );
}
