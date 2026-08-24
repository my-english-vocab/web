"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { IconCheckCircle } from "@/components/ui/Icons";
import { PageShell } from "@/components/ui/PageShell";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError } from "@/lib/api/client";
import { getQuizSetAttemptSummaries } from "@/lib/api/quiz";
import type { QuizSetAttemptSummary, Word } from "@/lib/api/types";
import { getWords } from "@/lib/api/words";
import { createQuizSets } from "@/lib/quiz/sets";
import styles from "./quiz.module.css";

function QuizSelectionContent() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [attempts, setAttempts] = useState<QuizSetAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [attemptsUnavailable, setAttemptsUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getWords(),
      getQuizSetAttemptSummaries().catch(() => {
        if (!cancelled) setAttemptsUnavailable(true);
        return [];
      }),
    ])
      .then(([wordData, attemptData]) => {
        if (cancelled) return;
        setWords(wordData);
        setAttempts(attemptData);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "단어를 불러오지 못했어요.",
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const quizSets = useMemo(() => createQuizSets(words), [words]);
  const attemptCountBySet = useMemo(
    () =>
      new Map(
        attempts.map((attempt) => [
          attempt.setNumber,
          attempt.completedCount,
        ]),
      ),
    [attempts],
  );

  if (loading) {
    return (
      <PageShell title="단어 테스트" showBack backHref="/home">
        <Spinner label="퀴즈 목록을 준비하는 중..." />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="단어 테스트" showBack backHref="/home">
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>문제가 생겼어요</p>
          <p>{error}</p>
          <Button onClick={() => router.push("/home")}>홈으로</Button>
        </div>
      </PageShell>
    );
  }

  if (words.length === 0) {
    return (
      <PageShell title="단어 테스트" showBack backHref="/home">
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>퀴즈할 단어가 없어요</p>
          <p>단어장에 단어를 먼저 추가해 주세요.</p>
          <Button onClick={() => router.push("/words/add")}>단어 추가</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="단어 테스트" showBack backHref="/home">
      <div className={styles.selectionLayout}>
        <section className={styles.selectionIntro}>
          <p className={styles.selectionEyebrow}>오늘은 어떤 방식으로 복습할까요?</p>
          <h2 className={styles.selectionTitle}>퀴즈를 선택해 주세요</h2>
          <p className={styles.selectionDesc}>
            세트는 등록 순서대로 묶고, 문제는 매번 무작위로 나와요.
          </p>
        </section>

        <button
          type="button"
          className={styles.randomCard}
          onClick={() => router.push("/quiz/session/all")}
        >
          <span className={styles.randomIcon} aria-hidden>
            <IconCheckCircle size={26} />
          </span>
          <span className={styles.randomCopy}>
            <span className={styles.randomLabel}>전체 복습</span>
            <span className={styles.randomTitle}>전체 랜덤 퀴즈</span>
            <span className={styles.randomDesc}>
              저장한 {words.length}개 단어를 한 번에 무작위로 풀어요
            </span>
          </span>
          <span className={styles.cardChevron} aria-hidden>
            ›
          </span>
        </button>

        <section className={styles.setSection}>
          <div className={styles.setSectionHeader}>
            <div>
              <p className={styles.setSectionEyebrow}>부담 없이 나눠서</p>
              <h3 className={styles.setSectionTitle}>세트별 퀴즈</h3>
            </div>
            <span className={styles.setCount}>{quizSets.length}개 세트</span>
          </div>

          {attemptsUnavailable ? (
            <p className={styles.attemptWarning} role="status">
              완료 횟수를 불러오지 못했지만 퀴즈는 정상적으로 풀 수 있어요.
            </p>
          ) : null}

          <div className={styles.setGrid}>
            {quizSets.map((quizSet) => {
              const completedCount = attemptCountBySet.get(quizSet.number) ?? 0;
              return (
                <button
                  type="button"
                  className={styles.setCard}
                  key={quizSet.number}
                  onClick={() =>
                    router.push(`/quiz/session/${quizSet.number}`)
                  }
                  aria-label={`Set ${quizSet.number}, 단어 ${quizSet.start}번부터 ${quizSet.end}번, 완료 ${completedCount}회`}
                >
                  <span className={styles.setCardTop}>
                    <span className={styles.setNumber}>Set {quizSet.number}</span>
                    <span className={styles.setWordCount}>
                      {quizSet.words.length}개
                    </span>
                  </span>
                  <span className={styles.setRange}>
                    단어 {quizSet.start}–{quizSet.end}
                  </span>
                  <span className={styles.setMeta}>
                    <span
                      className={
                        completedCount > 0
                          ? styles.completedBadge
                          : styles.notStartedBadge
                      }
                    >
                      완료 {completedCount}회
                    </span>
                    <span className={styles.miniChevron} aria-hidden>
                      ›
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

export default function QuizPage() {
  return (
    <AuthGuard>
      <QuizSelectionContent />
    </AuthGuard>
  );
}
