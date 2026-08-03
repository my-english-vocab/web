"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./PageShell.module.css";

type PageShellProps = {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Hide chrome title row (hero screens like home/login). */
  hideHeader?: boolean;
};

export function PageShell({
  title,
  showBack = false,
  backHref,
  rightSlot,
  children,
  className,
  hideHeader = false,
}: PageShellProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }
    router.back();
  };

  return (
    <div className={styles.shell}>
      {hideHeader ? (
        <div className={styles.headerHidden} aria-hidden />
      ) : (
        <header className={styles.header}>
          <div className={`${styles.side} ${styles.sideStart}`}>
            {showBack ? (
              <button
                type="button"
                className={styles.iconButton}
                aria-label="뒤로가기"
                onClick={handleBack}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 6L9 12L15 18"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>
          <h1 className={styles.title}>{title ?? ""}</h1>
          <div className={`${styles.side} ${styles.sideEnd}`}>{rightSlot}</div>
        </header>
      )}
      <main className={[styles.main, className ?? ""].filter(Boolean).join(" ")}>
        {children}
      </main>
    </div>
  );
}
