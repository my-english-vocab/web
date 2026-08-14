"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  /** Keep back navigation reachable after the header button scrolls away. */
  showFloatingBackOnScroll?: boolean;
};

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PageShell({
  title,
  showBack = false,
  backHref,
  rightSlot,
  children,
  className,
  hideHeader = false,
  showFloatingBackOnScroll = false,
}: PageShellProps) {
  const router = useRouter();
  const backButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showFloatingBack, setShowFloatingBack] = useState(false);

  useEffect(() => {
    if (!showBack || !showFloatingBackOnScroll || !backButtonRef.current) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setShowFloatingBack(!entry.isIntersecting);
    });

    observer.observe(backButtonRef.current);
    return () => observer.disconnect();
  }, [showBack, showFloatingBackOnScroll]);

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
                ref={backButtonRef}
                type="button"
                className={styles.iconButton}
                aria-label="뒤로가기"
                onClick={handleBack}
              >
                <BackIcon />
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
      {showFloatingBack ? (
        <button
          type="button"
          className={styles.floatingBackButton}
          aria-label="뒤로가기"
          onClick={handleBack}
        >
          <BackIcon />
        </button>
      ) : null}
    </div>
  );
}
