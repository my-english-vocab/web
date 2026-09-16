"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountPanel } from "@/components/account/AccountPanel";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";
import { IconBook, IconCheckCircle } from "@/components/ui/Icons";
import { PageShell } from "@/components/ui/PageShell";
import { getWords } from "@/lib/api/words";
import { restartOnboarding } from "@/lib/onboarding/session";
import styles from "./home.module.css";

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [wordLoadFailed, setWordLoadFailed] = useState(false);
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWords()
      .then((words) => {
        if (!cancelled) setWordCount(words.length);
      })
      .catch(() => {
        // A failed request is not evidence of an empty wordbook.
        if (!cancelled) setWordLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const closeAccountPanel = useCallback(() => setAccountPanelOpen(false), []);

  function handleRestartOnboarding() {
    if (!user) return;
    restartOnboarding(user.userId);
    setAccountPanelOpen(false);
    router.push("/onboarding");
  }

  const isEmpty = wordCount === 0;
  const hint =
    wordLoadFailed
      ? "단어 수를 불러오지 못했어요. 나의 단어장에서 다시 확인해 주세요."
      : wordCount === null
      ? "단어를 불러오는 중이에요"
      : isEmpty
        ? "첫 단어를 추가하고 시작해 보세요"
        : "가볍게 한 바퀴 돌아볼까요?";

  return (
    <PageShell hideHeader>
      <div className={styles.topBar}>
        <button
          ref={profileButtonRef}
          type="button"
          className={styles.profileTrigger}
          onClick={() => setAccountPanelOpen(true)}
          aria-expanded={accountPanelOpen}
          aria-haspopup="dialog"
          aria-label="마이페이지 열기"
        >
          <span className={styles.panelMenuIcon} aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          </span>
          <span className={styles.profileName}>{user?.displayName}</span>
        </button>
        <div className={styles.brandMark}>
          <span className={styles.brandDot} aria-hidden />
          <span className={styles.brandName}>My English Vocab</span>
        </div>
      </div>

      <section className={styles.welcome}>
        <p className={styles.eyebrow}>안녕하세요</p>
        <h2
          className={styles.greeting}
          aria-label={`${user?.displayName ?? ""}의 단어장`}
        >
          <span className={styles.greetingOwner} aria-hidden>
            <span className={styles.name}>{user?.displayName}</span>의
          </span>
          <span className={styles.greetingNoun} aria-hidden>
            단어장
          </span>
        </h2>
        <p className={styles.sub}>{hint}</p>
      </section>

      <div className={styles.cardsRow}>
        <div className={styles.heroCard}>
          <p className={styles.statLabel}>저장된 단어</p>
          {wordLoadFailed ? (
            <p className={styles.statValue} aria-label="단어 수 확인 불가">—</p>
          ) : wordCount === null ? (
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
              onClick={handleRestartOnboarding}
            >
              추천 단어로 시작하기
            </button>
          ) : null}
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
      {accountPanelOpen ? (
        <AccountPanel
          onClose={closeAccountPanel}
          onRestartOnboarding={handleRestartOnboarding}
          returnFocusRef={profileButtonRef}
        />
      ) : null}
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
