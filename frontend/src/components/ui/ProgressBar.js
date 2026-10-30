import styles from "./ProgressBar.module.css";

export default function ProgressBar({
  value,
  label = "میزان پیشرفت",
  showValue = true,
}) {
  const validValue =
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span>{label}</span>
        {showValue && (
          <span className={styles.value}>
            {validValue === null ? "نامشخص" : `${validValue}٪`}
          </span>
        )}
      </div>

      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={validValue ?? undefined}
      >
        {validValue !== null && (
          <span
            className={styles.fill}
            style={{ width: `${validValue}%` }}
          />
        )}
      </div>
    </div>
  );
}
