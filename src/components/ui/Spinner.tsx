import styles from "./Spinner.module.css";

type SpinnerProps = {
  label?: string;
  centered?: boolean;
};

export function Spinner({ label, centered = true }: SpinnerProps) {
  const content = (
    <>
      <div className={styles.spinner} aria-hidden />
      {label ? <p>{label}</p> : null}
    </>
  );

  if (!centered) return <div className={styles.spinner} aria-label={label} />;

  return (
    <div className={styles.center} role="status" aria-live="polite">
      {content}
    </div>
  );
}
