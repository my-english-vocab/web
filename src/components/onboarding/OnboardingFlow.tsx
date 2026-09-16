"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  IconBook,
  IconCheckCircle,
  IconPartyPopper,
} from "@/components/ui/Icons";
import {
  completeOnboarding,
  type CompleteResult,
  type OnboardingCatalog,
} from "@/lib/api/onboarding";
import {
  dismissOnboarding,
  readSession,
  writeSession,
} from "@/lib/onboarding/session";
import styles from "./Onboarding.module.css";

type Stage = "goal" | "check" | "result";
type Draft = {
  version: number;
  stage: Stage;
  trackId: string;
  index: number;
  answers: (boolean | null)[];
  selected: string[];
};

const difficultyNames = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

const goalVisuals: Record<string, { label: string; tone: string }> = {
  toeic: { label: "Aa", tone: "blue" },
  csat: { label: "", tone: "green" },
  daily: { label: "Hi!", tone: "orange" },
  toefl: { label: "A+", tone: "purple" },
  opic: { label: "Say", tone: "teal" },
  "business-email": { label: "@", tone: "indigo" },
  "it-dev": { label: "</>", tone: "slate" },
};

function readDraft(userId: number, catalog: OnboardingCatalog): Draft {
  const fresh: Draft = {
    version: catalog.version,
    stage: "goal",
    trackId: "",
    index: 0,
    answers: [],
    selected: [],
  };
  try {
    const draft = JSON.parse(
      readSession(userId, "draft") ?? "null",
    ) as Draft | null;
    const track = catalog.tracks.find((item) => item.id === draft?.trackId);
    if (
      !draft ||
      draft.version !== catalog.version ||
      !track ||
      !["goal", "check", "result"].includes(draft.stage) ||
      !Number.isInteger(draft.index) ||
      draft.index < 0 ||
      draft.index >= track.words.length ||
      !Array.isArray(draft.answers) ||
      draft.answers.length !== track.words.length ||
      !draft.answers.every(
        (answer) => answer === null || typeof answer === "boolean",
      ) ||
      !Array.isArray(draft.selected) ||
      !draft.selected.every((id) =>
        track.words.some((word) => word.id === id),
      ) ||
      (draft.stage === "result" &&
        draft.answers.some((answer) => answer === null))
    )
      return fresh;
    return draft;
  } catch {
    return fresh;
  }
}

export function OnboardingFlow({
  catalog,
  userId,
}: {
  catalog: OnboardingCatalog;
  userId: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => readDraft(userId, catalog));
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompleteResult | null>(null);
  const savingRef = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const track = catalog.tracks.find((item) => item.id === draft.trackId);
  const word = track?.words[draft.index];
  const total = track?.words.length ?? 10;
  const known = draft.answers.filter((answer) => answer === true).length;
  const step = result
    ? 3
    : draft.stage === "goal"
      ? 1
      : draft.stage === "check"
        ? 2
        : 3;

  useEffect(() => {
    if (!result) writeSession(userId, "draft", JSON.stringify(draft));
  }, [draft, userId, result]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.current?.focus({ preventScroll: true });
  }, [draft.stage, draft.index, result]);

  function leave(path: string) {
    dismissOnboarding(userId);
    router.replace(path);
  }

  function answer(isKnown: boolean) {
    if (!track) return;
    const answers = [...draft.answers];
    answers[draft.index] = isKnown;
    setRevealed(false);
    if (draft.index === total - 1) {
      setDraft({
        ...draft,
        answers,
        stage: "result",
        selected: track.words
          .filter((_, index) => answers[index] === false)
          .map((item) => item.id),
      });
    } else setDraft({ ...draft, answers, index: draft.index + 1 });
  }

  async function save() {
    if (!track || savingRef.current) return;
    if (draft.selected.length === 0) {
      leave("/home");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const response = await completeOnboarding(
        catalog.version,
        track.id,
        draft.selected,
      );
      dismissOnboarding(userId);
      setResult(response);
    } catch {
      setError(
        "저장을 확인하지 못했어요. 선택한 단어는 그대로예요. 다시 눌러도 중복으로 담기지 않아요.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>
          <span className={styles.brandDot} />
          My English Vocab
        </span>
        {!result && (
          <button
            className={styles.skip}
            onClick={() => leave("/home")}
            disabled={saving}
          >
            건너뛰기 <span aria-hidden>↗</span>
          </button>
        )}
      </header>
      <main className={styles.layout}>
        <aside className={styles.intro}>
          <span className={styles.eyebrow}>A SMALL START, A NEW CHAPTER</span>
          <h2>
            나의 영어,
            <br />첫 페이지를 열어요<span className={styles.blue}>.</span>
          </h2>
          <p>
            지금 필요한 단어를 만나고
            <br />
            나만의 단어장을 만들어 보세요.
          </p>
          <ol className={styles.steps} aria-label="첫 단어장 만들기 단계">
            {["학습 목적 고르기", "10개 단어 만나기", "내 단어장에 담기"].map(
              (label, index) => (
                <li
                  key={label}
                  aria-current={step === index + 1 ? "step" : undefined}
                  data-complete={step > index + 1}
                >
                  <span>{step > index + 1 ? "✓" : `0${index + 1}`}</span>
                  {label}
                </li>
              ),
            )}
          </ol>
          <div className={styles.illustration} aria-hidden="true">
            <div className={styles.orbit} />
            <div className={styles.paperBack} />
            <div className={styles.paper}>
              <span className={styles.paperLabel}>YOUR FIRST WORD</span>
              <strong>
                begin<span>.</span>
              </strong>
              <span className={styles.paperMeaning}>시작하다</span>
              <div className={styles.paperLine} />
              <div className={styles.paperLineShort} />
              <span className={styles.paperBottom}>
                작은 시작이 만드는 변화 <IconBook size={20} />
              </span>
            </div>
            <span className={styles.spark}>✦</span>
            <span className={styles.floatTag}>
              <IconCheckCircle size={17} /> 나에게 필요한 단어부터
            </span>
          </div>
          <p className={styles.sideNote}>
            점수도, 시간 제한도 없어요.
            <br />
            지금 아는 만큼 편하게 시작해요.
          </p>
        </aside>

        <section className={styles.workspace} aria-label="첫 단어장 만들기">
          <div className={styles.mobileStep}>
            첫 단어장 만들기 <span>{step} / 3</span>
          </div>
          {result ? (
            <div className={`${styles.panel} ${styles.success}`}>
              <span className={styles.celebration}>
                <IconPartyPopper size={40} />
              </span>
              <span className={styles.eyebrow}>YOUR NEXT CHAPTER</span>
              <h1 ref={heading} tabIndex={-1}>
                {result.addedCount > 0 ? (
                  <>
                    첫 단어들이
                    <br />
                    단어장에 도착했어요!
                  </>
                ) : (
                  <>
                    고른 단어들이
                    <br />
                    이미 단어장에 있어요
                  </>
                )}
              </h1>
              <p>
                {result.addedCount > 0
                  ? `${result.addedCount}개의 단어를 새로 담았어요.`
                  : "중복으로 추가하지 않고 기존 단어를 유지했어요."}
                <br />
                예문과 함께 다시 만나며 조금씩 익혀 보세요.
              </p>
              {result.existingCount > 0 && result.addedCount > 0 && (
                <p className={styles.note}>
                  이미 있던 {result.existingCount}개는 그대로 두었어요.
                </p>
              )}
              <div className={styles.successWords}>
                {track?.words
                  .filter((item) => draft.selected.includes(item.id))
                  .map((item) => (
                    <span key={item.id}>{item.term}</span>
                  ))}
              </div>
              <Button onClick={() => leave("/words")}>
                내 단어장 보러 가기 <span aria-hidden>→</span>
              </Button>
              <button
                className={styles.textButton}
                onClick={() => leave("/quiz")}
              >
                바로 복습해 볼래요
              </button>
            </div>
          ) : draft.stage === "goal" ? (
            <div className={`${styles.panel} ${styles.goalPanel}`}>
              <span className={styles.stepLabel}>STEP 01 · 나의 학습 방향</span>
              <h1 ref={heading} tabIndex={-1}>
                어떤 영어를
                <br />
                만나고 싶으세요?
              </h1>
              <p className={styles.description}>
                목적에 맞는 10개 단어를 준비했어요.
                <br />
                가장 가까운 목표를 하나 골라 주세요.
              </p>
              <fieldset className={styles.goals}>
                <legend className={styles.srOnly}>학습 목적 선택</legend>
                {catalog.tracks.map((item) => (
                  <label
                    className={styles.goal}
                    key={item.id}
                    data-selected={draft.trackId === item.id}
                  >
                    <input
                      type="radio"
                      name="learning-goal"
                      value={item.id}
                      checked={draft.trackId === item.id}
                      onChange={() =>
                        setDraft({
                          version: catalog.version,
                          stage: "goal",
                          trackId: item.id,
                          index: 0,
                          answers: item.words.map(() => null),
                          selected: [],
                        })
                      }
                    />
                    <span
                      className={styles.goalIcon}
                      data-tone={goalVisuals[item.id]?.tone ?? "blue"}
                      aria-hidden
                    >
                      {item.id === "csat" ? (
                        <IconBook size={26} />
                      ) : (
                        (goalVisuals[item.id]?.label ?? "En")
                      )}
                    </span>
                    <span className={styles.goalCopy}>
                      <span className={styles.goalSubtitle}>
                        {item.subtitle}
                      </span>
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </span>
                    <span className={styles.radioMark} aria-hidden>
                      {draft.trackId === item.id ? "●" : ""}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className={styles.goalActions}>
                <p className={styles.miniInfo} aria-live="polite">
                  {track
                    ? `${track.title} · 10개 단어`
                    : "학습 목적을 하나 골라 주세요"}
                </p>
                <Button
                  disabled={!track}
                  onClick={() => setDraft({ ...draft, stage: "check" })}
                >
                  나의 첫 단어 만나기 <span aria-hidden>→</span>
                </Button>
                <p className={styles.note}>
                  부담 없이 둘러보고, 언제든 건너뛸 수 있어요.
                </p>
              </div>
            </div>
          ) : draft.stage === "check" && word ? (
            <div className={styles.panel}>
              <div className={styles.quizMeta}>
                <span className={styles.stepLabel}>{track?.title}</span>
                <span>
                  <strong>{String(draft.index + 1).padStart(2, "0")}</strong> /{" "}
                  {total}
                </span>
              </div>
              <progress
                className={styles.progress}
                value={draft.index + 1}
                max={total}
                aria-label="단어 진행률"
              />
              <div className={styles.wordCard} key={word.id}>
                <span
                  className={styles.difficulty}
                  data-level={word.difficulty}
                >
                  {difficultyNames[word.difficulty]}
                </span>
                <p className={styles.wordPrompt}>이 단어, 얼마나 익숙한가요?</p>
                <h1
                  className={styles.term}
                  ref={heading}
                  tabIndex={-1}
                  lang="en"
                >
                  {word.term}
                </h1>
                <p className={styles.example} lang="en">
                  {word.exampleSentence}
                </p>
                <button
                  className={styles.reveal}
                  aria-expanded={revealed}
                  aria-controls="word-meaning"
                  onClick={() => setRevealed(!revealed)}
                >
                  {revealed ? "뜻과 해석 접기" : "뜻과 해석 확인하기"}
                  <span aria-hidden>{revealed ? "−" : "+"}</span>
                </button>
                {revealed && (
                  <div className={styles.meaning} id="word-meaning">
                    <strong>{word.definition}</strong>
                    <p>{word.meaningOfExampleSentence}</p>
                  </div>
                )}
              </div>
              <p className={styles.answerHint}>
                뜻이 바로 떠오르지 않으면 ‘모르겠어요’를 골라 주세요.
              </p>
              <div className={styles.answers}>
                <button
                  onClick={(event) => {
                    if (event.detail < 2) answer(false);
                  }}
                >
                  <span aria-hidden>＋</span> 모르겠어요
                  <small>함께 익혀 볼래요</small>
                </button>
                <button
                  onClick={(event) => {
                    if (event.detail < 2) answer(true);
                  }}
                >
                  <IconCheckCircle size={21} /> 알고 있어요
                  <small>뜻이 떠올라요</small>
                </button>
              </div>
              <button
                className={styles.textButton}
                onClick={() => {
                  setRevealed(false);
                  setDraft({
                    ...draft,
                    ...(draft.index === 0
                      ? { stage: "goal" as const }
                      : { index: draft.index - 1 }),
                  });
                }}
              >
                ← {draft.index === 0 ? "목적 다시 고르기" : "이전 단어"}
              </button>
              <p className={styles.note}>
                난이도는 단어 선택을 위한 참고 기준이에요.
              </p>
            </div>
          ) : (
            <div className={`${styles.panel} ${styles.reviewPanel}`}>
              <span className={styles.resultIcon}>
                <IconCheckCircle size={28} />
              </span>
              <span className={styles.stepLabel}>STEP 03 · 나의 첫 단어장</span>
              <h1 ref={heading} tabIndex={-1}>
                {known === total ? (
                  <>
                    익숙한 단어가 많네요!
                    <br />
                    좋은 출발이에요.
                  </>
                ) : known === 0 ? (
                  <>
                    새로운 단어 10개,
                    <br />
                    이미 한 걸음 나아갔어요.
                  </>
                ) : (
                  <>
                    잘했어요! 이제
                    <br />내 단어로 만들어 볼까요?
                  </>
                )}
              </h1>
              <p className={styles.description}>
                {known === total
                  ? "모두 익숙해도 좋아요."
                  : "낯설었던 단어는 미리 선택해 두었어요."}
                <br />
                익숙한 단어도, 다시 보고 싶은 단어도 담아 보세요.
              </p>
              <div className={styles.summary}>
                <span>
                  알고 있어요 <strong>{known}</strong>
                </span>
                <span>
                  함께 익힐 단어 <strong>{total - known}</strong>
                </span>
              </div>
              <div className={styles.selectionHeader}>
                <strong>
                  담을 단어 <span>{draft.selected.length}</span>
                </strong>
                <button
                  disabled={saving}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      selected:
                        draft.selected.length === total
                          ? []
                          : (track?.words.map((item) => item.id) ?? []),
                    })
                  }
                >
                  {draft.selected.length === total ? "전체 해제" : "전체 선택"}
                </button>
              </div>
              <div className={styles.wordList}>
                {track?.words.map((item, index) => (
                  <div
                    className={styles.wordRow}
                    key={item.id}
                    data-selected={draft.selected.includes(item.id)}
                  >
                    <label className={styles.wordSelect}>
                      <input
                        type="checkbox"
                        checked={draft.selected.includes(item.id)}
                        disabled={saving}
                        onChange={() =>
                          setDraft({
                            ...draft,
                            selected: draft.selected.includes(item.id)
                              ? draft.selected.filter((id) => id !== item.id)
                              : [...draft.selected, item.id],
                          })
                        }
                        aria-label={`${item.term} 담기`}
                      />
                      <span>
                        <strong lang="en">{item.term}</strong>
                        <span>{item.definition}</span>
                      </span>
                      <span className={styles.answerBadge}>
                        {draft.answers[index] ? "알던 단어" : "새로 익힐 단어"}
                      </span>
                    </label>
                    <details className={styles.wordDetails}>
                      <summary>예문 보기</summary>
                      <p lang="en">{item.exampleSentence}</p>
                      <p>{item.meaningOfExampleSentence}</p>
                    </details>
                  </div>
                ))}
              </div>
              <div className={styles.saveBar}>
                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
                <Button disabled={saving} onClick={() => void save()}>
                  {saving
                    ? "단어장에 담고 있어요..."
                    : draft.selected.length
                      ? `${draft.selected.length}개 단어 담고 시작하기`
                      : "추가하지 않고 마치기"}
                </Button>
                <p className={styles.note}>
                  {draft.selected.length
                    ? "선택한 단어의 뜻·예문·해석을 함께 저장해요."
                    : "단어를 고르지 않고 마쳐도 괜찮아요."}
                </p>
              </div>
              <button
                className={styles.textButton}
                disabled={saving}
                onClick={() =>
                  setDraft({ ...draft, stage: "check", index: total - 1 })
                }
              >
                ← 응답 다시 살펴보기
              </button>
            </div>
          )}
        </section>
      </main>
      <footer className={styles.footer}>
        작게 시작해도 괜찮아요. 오늘 만난 단어부터, 하나씩.
      </footer>
    </div>
  );
}
