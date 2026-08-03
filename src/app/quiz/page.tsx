"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { IconPartyPopper } from "@/components/ui/Icons";
import { PageShell } from "@/components/ui/PageShell";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError } from "@/lib/api/client";
import type { Word } from "@/lib/api/types";
import { getWords, markLearned } from "@/lib/api/words";
import styles from "./quiz.module.css";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function QuizContent() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getWords()
      .then((data) => {
        if (!cancelled) {
          setWords(shuffleArray(data));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "단어를 불러오지 못했어요.",
          );
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const finished = !loading && words.length > 0 && currentIndex >= words.length;
  const currentWord = words[currentIndex];

  const goNext = useCallback(() => {
    setShowDefinition(false);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const handleMarkLearned = useCallback(async () => {
    if (!currentWord || busy) return;
    setBusy(true);
    try {
      await markLearned(currentWord.id);
      setLearnedCount((prev) => prev + 1);
    } catch {
      // level update failure should not block quiz flow
    } finally {
      setBusy(false);
      goNext();
    }
  }, [busy, currentWord, goNext]);

  useEffect(() => {
    if (loading || finished || !currentWord) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "Enter") {
        if (showDefinition) {
          if (event.key === "Enter") {
            void handleMarkLearned();
          } else {
            goNext();
          }
        } else {
          setShowDefinition(true);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    loading,
    finished,
    currentWord,
    showDefinition,
    goNext,
    handleMarkLearned,
  ]);

  if (loading) {
    return (
      <PageShell title="단어 테스트" showBack backHref="/home">
        <Spinner label="퀴즈를 준비하는 중..." />
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

  if (finished) {
    return (
      <PageShell title="테스트 결과" showBack backHref="/home">
        <div className={styles.result}>
          <div className={styles.resultBadge} aria-hidden>
            <IconPartyPopper size={40} />
          </div>
          <h2 className={styles.resultTitle}>정말 멋져요!</h2>
          <p className={styles.resultDesc}>
            <span className={styles.highlight}>{words.length}개</span>를
            확인했고, 그중{" "}
            <span className={styles.highlight}>{learnedCount}개</span>는
            ‘외웠어요’로 레벨이 올랐어요.
          </p>
          <div className={styles.resultStats}>
            <div className={styles.statChip}>
              <span className={styles.statChipLabel}>확인</span>
              <span className={styles.statChipValue}>{words.length}</span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statChipLabel}>외움</span>
              <span className={styles.statChipValue}>{learnedCount}</span>
            </div>
          </div>
          <div className={styles.resultActions}>
            <Button onClick={() => router.replace("/home")}>홈으로</Button>
            <Button variant="ghost" onClick={() => router.push("/words")}>
              단어장 보기
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <PageShell title="단어 테스트" showBack backHref="/home">
      <div className={styles.quizLayout}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={styles.info}>
          <span>
            {currentIndex + 1} / {words.length}
          </span>
          <span
            className={styles.badge}
            title="퀴즈에서 ‘외웠어요’를 누르면 올라가요"
          >
            Lv.{currentWord.level}
          </span>
        </div>

        <div className={styles.card}>
          <h2 className={styles.term}>{currentWord.term}</h2>
          <div className={styles.section}>
            <span className={styles.label}>예문</span>
            <p className={styles.example}>
              {currentWord.exampleSentence || "예문이 없어요."}
            </p>
          </div>

          {showDefinition ? (
            <div className={styles.reveal}>
              <span className={styles.label}>뜻</span>
              <p className={styles.definition}>{currentWord.definition}</p>
              {currentWord.meaningOfExampleSentence ? (
                <div className={styles.meaning}>
                  <span className={styles.label}>예문 해석</span>
                  <p className={styles.meaningText}>
                    {currentWord.meaningOfExampleSentence}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className={styles.hiddenHint}>
              뜻을 떠올려 본 뒤, 아래에서 확인해 보세요
            </p>
          )}
        </div>

        <div className={styles.footer}>
          {showDefinition ? (
            <>
              <Button variant="secondary" onClick={goNext} disabled={busy}>
                모르겠어요
              </Button>
              <Button onClick={handleMarkLearned} disabled={busy}>
                외웠어요
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={goNext}>
                넘기기
              </Button>
              <Button onClick={() => setShowDefinition(true)}>뜻 보기</Button>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default function QuizPage() {
  return (
    <AuthGuard>
      <QuizContent />
    </AuthGuard>
  );
}
