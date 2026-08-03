"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";
import { IconBook, IconCheckCircle } from "@/components/ui/Icons";
import { PageShell } from "@/components/ui/PageShell";
import { getWords } from "@/lib/api/words";
import styles from "./home.module.css";

function HomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWords()
      .then((words) => {
        if (!cancelled) setWordCount(words.length);
      })
      .catch(() => {
        if (!cancelled) setWordCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  const isEmpty = wordCount === 0;
  const hint =
    wordCount === null
      ? "단어를 불러오는 중이에요"
      : isEmpty
        ? "첫 단어를 추가하고 시작해 보세요"
        : "가볍게 한 바퀴 돌아볼까요?";

  return (
    <PageShell hideHeader>
      <div className={styles.topBar}>
        <div className={styles.brandMark}>
          <span className={styles.brandDot} aria-hidden />
          <span className={styles.brandName}>My English Vocab</span>
        </div>
        <button
          type="button"
          className={styles.logout}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "나가는 중..." : "로그아웃"}
        </button>
      </div>

      <section className={styles.welcome}>
        <p className={styles.eyebrow}>안녕하세요</p>
        <h2 className={styles.greeting}>
          <span className={styles.name}>{user?.displayName}</span>의{" "}
          <br />
          단어장
        </h2>
        <p className={styles.sub}>{hint}</p>
      </section>

      <div className={styles.cardsRow}>
        <div className={styles.heroCard}>
          <p className={styles.statLabel}>저장된 단어</p>
          {wordCount === null ? (
            <div className={styles.skeleton} aria-hidden />
          ) : (
            <p className={styles.statValue}>
              {wordCount}
              <span className={styles.statUnit}>개</span>
            </p>
          )}
          <p className={styles.statHint}>
            {isEmpty
              ? "모르는 단어부터 하나씩 모아 보세요"
              : "모르는 단어만 모아 둔 나만의 목록"}
          </p>
          {isEmpty ? (
            <button
              type="button"
              className={styles.heroCta}
              onClick={() => router.push("/words/add")}
            >
              첫 단어 추가하기
            </button>
          ) : null}
        </div>

        <nav className={styles.menu}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => router.push("/words")}
          >
            <span
              className={`${styles.iconWell} ${styles.iconWellBlue}`}
              aria-hidden
            >
              <IconBook size={24} />
            </span>
            <span>
              <span className={styles.menuTitle}>나의 단어장</span>
              <span className={styles.menuDesc}>추가 · 수정 · 예문 관리</span>
            </span>
            <span className={styles.chevron}>›</span>
          </button>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => router.push("/quiz")}
            disabled={isEmpty}
          >
            <span
              className={`${styles.iconWell} ${styles.iconWellMint}`}
              aria-hidden
            >
              <IconCheckCircle size={24} />
            </span>
            <span>
              <span className={styles.menuTitle}>단어 테스트</span>
              <span className={styles.menuDesc}>
                {isEmpty
                  ? "단어를 추가하면 시작할 수 있어요"
                  : "뜻 가리기로 가볍게 복습"}
              </span>
            </span>
            <span className={styles.chevron}>›</span>
          </button>
        </nav>
      </div>
    </PageShell>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}
