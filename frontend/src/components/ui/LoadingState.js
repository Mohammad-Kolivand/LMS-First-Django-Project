import styles from "./LoadingState.module.css";

export default function LoadingState({ label = "در حال بارگذاری..." }) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
