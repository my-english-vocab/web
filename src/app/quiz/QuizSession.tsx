"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IconPartyPopper } from "@/components/ui/Icons";
import { PageShell } from "@/components/ui/PageShell";
import { PronunciationButton } from "@/components/ui/PronunciationButton";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError } from "@/lib/api/client";
import { completeQuizSet } from "@/lib/api/quiz";
import type { Word } from "@/lib/api/types";
import { getWords, markLearned } from "@/lib/api/words";
import { createQuizSets, shuffleArray } from "@/lib/quiz/sets";
import styles from "./quiz.module.css";

type QuizSessionProps = {
  selection: string;
};

type SelectedQuiz =
  | { kind: "all"; title: "전체 랜덤"; words: Word[] }
  | {
      kind: "set";
      title: string;
      setNumber: number;
      start: number;
      end: number;
      words: Word[];
    };

export function QuizSession({ selection }: QuizSessionProps) {
  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState<SelectedQuiz | null>(null);
  const [quizWords, setQuizWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [missedWords, setMissedWords] = useState<Word[]>([]);
  const [reviewingMissed, setReviewingMissed] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [attemptSaveError, setAttemptSaveError] = useState(false);
  const [pronunciationError, setPronunciationError] = useState<string | null>(
    null,
  );
  const savedAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getWords()
      .then((words) => {
        if (cancelled) return;

        let nextQuiz: SelectedQuiz | null = null;
        if (selection === "all") {
          nextQuiz = { kind: "all", title: "전체 랜덤", words };
        } else {
          const setNumber = Number(selection);
          const quizSet = createQuizSets(words).find(
            (candidate) => candidate.number === setNumber,
          );
          if (quizSet) {
            nextQuiz = {
              kind: "set",
              title: `Set ${quizSet.number}`,
              setNumber: quizSet.number,
              start: quizSet.start,
              end: quizSet.end,
              words: quizSet.words,
            };
          }
        }

        if (!nextQuiz || nextQuiz.words.length === 0) {
          setError("선택한 퀴즈를 찾을 수 없어요.");
          setLoading(false);
          return;
        }

        setSelectedQuiz(nextQuiz);
        setQuizWords(shuffleArray(nextQuiz.words));
        setAttemptId(crypto.randomUUID());
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
  }, [selection]);

  const finished =
    !loading && quizWords.length > 0 && currentIndex >= quizWords.length;
  const currentWord = quizWords[currentIndex];

  const saveSetAttempt = useCallback(async (completedLearnedCount = learnedCount) => {
    if (
      !attemptId ||
      selectedQuiz?.kind !== "set" ||
      savedAttemptRef.current === attemptId
    ) {
      return;
    }

    savedAttemptRef.current = attemptId;
    setSavingAttempt(true);
    setAttemptSaveError(false);
    try {
      await completeQuizSet(selectedQuiz.setNumber, {
        attemptId,
        wordCount: quizWords.length,
        learnedCount: completedLearnedCount,
      });
    } catch {
      savedAttemptRef.current = null;
      setAttemptSaveError(true);
    } finally {
      setSavingAttempt(false);
    }
  }, [attemptId, learnedCount, quizWords.length, selectedQuiz]);

  const finishCurrentWord = useCallback((completedLearnedCount: number) => {
    setPronunciationError(null);
    setShowDefinition(false);
    setCurrentIndex((previous) => previous + 1);
    if (currentIndex + 1 >= quizWords.length) {
      void saveSetAttempt(completedLearnedCount);
    }
  }, [currentIndex, quizWords.length, saveSetAttempt]);

  const goNext = useCallback(() => {
    finishCurrentWord(learnedCount);
  }, [finishCurrentWord, learnedCount]);

  const handleUnknown = useCallback(() => {
    if (!currentWord || busy) return;
    setMissedWords((previous) =>
      previous.some((word) => word.id === currentWord.id)
        ? previous
        : [...previous, currentWord],
    );
    finishCurrentWord(learnedCount);
  }, [busy, currentWord, finishCurrentWord, learnedCount]);

  const handleMarkLearned = useCallback(async () => {
    if (!currentWord || busy) return;
    setBusy(true);
    let completedLearnedCount = learnedCount;
    try {
      await markLearned(currentWord.id);
      completedLearnedCount += 1;
      setLearnedCount(completedLearnedCount);
    } catch {
      // level update failure should not block quiz flow
    } finally {
      setBusy(false);
      finishCurrentWord(completedLearnedCount);
    }
  }, [busy, currentWord, finishCurrentWord, learnedCount]);

  useEffect(() => {
    if (loading || finished || !currentWord || reviewingMissed) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "Enter") {
        if (showDefinition) {
          if (event.key === "Enter") {
            void handleMarkLearned();
          } else {
            handleUnknown();
          }
        } else {
          setShowDefinition(true);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    currentWord,
    finished,
    handleMarkLearned,
    handleUnknown,
    loading,
    reviewingMissed,
    showDefinition,
  ]);

  if (loading) {
    return (
      <PageShell title="단어 테스트" showBack backHref="/quiz">
        <Spinner label="퀴즈를 준비하는 중..." />
      </PageShell>
    );
  }

  if (error || !selectedQuiz) {
    return (
      <PageShell title="단어 테스트" showBack backHref="/quiz">
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>퀴즈를 열 수 없어요</p>
          <p>{error ?? "퀴즈 정보를 다시 확인해 주세요."}</p>
          <Button onClick={() => router.replace("/quiz")}>퀴즈 선택으로</Button>
        </div>
      </PageShell>
    );
  }

  if (reviewingMissed) {
    return (
      <PageShell title="모르겠어요 단어">
        <div className={styles.reviewLayout}>
          <header className={styles.reviewHeader}>
            <span className={styles.reviewCount}>{missedWords.length}개</span>
            <h2 className={styles.reviewTitle}>한 번 더 눈에 담아보세요</h2>
            <p className={styles.reviewDesc}>
              이 목록은 지금 퀴즈 결과에서만 볼 수 있고 따로 저장되지 않아요.
            </p>
          </header>

          <div className={styles.reviewList}>
            {missedWords.map((word, index) => (
              <article className={styles.reviewCard} key={word.id}>
                <div className={styles.reviewCardTop}>
                  <span className={styles.reviewNumber}>{index + 1}</span>
                  <h3 className={styles.reviewTerm}>{word.term}</h3>
                </div>
                <p className={styles.reviewDefinition}>{word.definition}</p>
                {word.exampleSentence ? (
                  <div className={styles.reviewExample}>
                    <p>{word.exampleSentence}</p>
                    {word.meaningOfExampleSentence ? (
                      <p className={styles.reviewMeaning}>
                        {word.meaningOfExampleSentence}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className={styles.reviewActions}>
            <Button onClick={() => setReviewingMissed(false)}>
              결과로 돌아가기
            </Button>
            <Button variant="ghost" onClick={() => router.replace("/home")}>
              홈으로
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (finished) {
    return (
      <PageShell title="테스트 결과" showBack backHref="/quiz">
        <div className={styles.result}>
          <div className={styles.resultBadge} aria-hidden>
            <IconPartyPopper size={40} />
          </div>
          <p className={styles.resultEyebrow}>{selectedQuiz.title} 완료</p>
          <h2 className={styles.resultTitle}>정말 멋져요!</h2>
          <p className={styles.resultDesc}>
            <span className={styles.highlight}>{quizWords.length}개</span>를
            확인했고, 그중{" "}
            <span className={styles.highlight}>{learnedCount}개</span>는
            ‘외웠어요’로 레벨이 올랐어요.
          </p>
          <div className={styles.resultStats}>
            <div className={styles.statChip}>
              <span className={styles.statChipLabel}>확인</span>
              <span className={styles.statChipValue}>{quizWords.length}</span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statChipLabel}>외움</span>
              <span className={styles.statChipValue}>{learnedCount}</span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statChipLabel}>모르겠어요</span>
              <span className={styles.statChipValue}>{missedWords.length}</span>
            </div>
          </div>

          {selectedQuiz.kind === "set" && savingAttempt ? (
            <p className={styles.saveStatus} role="status">
              완료 횟수를 저장하는 중...
            </p>
          ) : null}
          {selectedQuiz.kind === "set" && attemptSaveError ? (
            <div className={styles.saveError} role="alert">
              <span>완료 횟수를 저장하지 못했어요.</span>
              <button type="button" onClick={() => void saveSetAttempt()}>
                다시 저장
              </button>
            </div>
          ) : null}

          <div className={styles.resultActions}>
            <Button onClick={() => router.replace("/home")}>홈으로</Button>
            {missedWords.length > 0 ? (
              <Button
                variant="secondary"
                onClick={() => setReviewingMissed(true)}
              >
                ‘모르겠어요’ 단어 {missedWords.length}개 보기
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => router.push("/words")}>
              단어장 보기
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const progress = ((currentIndex + 1) / quizWords.length) * 100;

  return (
    <PageShell title={selectedQuiz.title} showBack backHref="/quiz">
      <div className={styles.quizLayout}>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={quizWords.length}
          aria-valuenow={currentIndex + 1}
          aria-label="퀴즈 진행률"
        >
          <div
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={styles.info}>
          <span>
            {currentIndex + 1} / {quizWords.length}
          </span>
          <span className={styles.infoMode}>
            {selectedQuiz.kind === "set"
              ? `${selectedQuiz.start}–${selectedQuiz.end}번 · 무작위`
              : "전체 단어 · 무작위"}
          </span>
          <span
            className={styles.badge}
            title="퀴즈에서 ‘외웠어요’를 누르면 올라가요"
          >
            Lv.{currentWord.level}
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.termRow}>
            <h2 className={styles.term}>{currentWord.term}</h2>
            <PronunciationButton
              text={currentWord.term}
              onUnsupported={() =>
                setPronunciationError(
                  "이 브라우저에서는 음성 재생을 지원하지 않아요.",
                )
              }
            />
          </div>
          {pronunciationError ? (
            <p className={styles.pronunciationError} role="alert">
              {pronunciationError}
            </p>
          ) : null}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.label}>예문</span>
              {currentWord.exampleSentence ? (
                <PronunciationButton
                  text={currentWord.exampleSentence}
                  ariaLabel="예문 발음 듣기"
                  onUnsupported={() =>
                    setPronunciationError(
                      "이 브라우저에서는 음성 재생을 지원하지 않아요.",
                    )
                  }
                />
              ) : null}
            </div>
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
              <Button
                variant="secondary"
                onClick={handleUnknown}
                disabled={busy}
              >
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
