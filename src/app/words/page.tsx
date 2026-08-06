"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { IconHelp, IconPlus } from "@/components/ui/Icons";
import { Modal } from "@/components/ui/Modal";
import { PageShell } from "@/components/ui/PageShell";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api/client";
import type { Word } from "@/lib/api/types";
import { deleteWord, getWords, updateWord } from "@/lib/api/words";
import styles from "./words.module.css";

type SortOrder = "recent" | "az" | "level";

function WordsContent() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOrder>("recent");
  const [selected, setSelected] = useState<Word | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFloatFab, setShowFloatFab] = useState(false);
  const addBarRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [meaningOfExampleSentence, setMeaningOfExampleSentence] = useState("");

  useEffect(() => {
    let cancelled = false;

    getWords()
      .then((data) => {
        if (!cancelled) setWords(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "단어 목록을 불러오지 못했어요.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (words.length === 0) {
      return;
    }

    const mq = window.matchMedia("(min-width: 900px)");
    let observer: IntersectionObserver | null = null;

    const setup = () => {
      observer?.disconnect();
      const target = mq.matches ? toolbarRef.current : addBarRef.current;
      if (!target) {
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => setShowFloatFab(!entry.isIntersecting),
        { threshold: 0.15 },
      );
      observer.observe(target);
    };

    setup();
    mq.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      mq.removeEventListener("change", setup);
    };
  }, [words.length, loading]);

  const sorted = useMemo(() => {
    const copy = [...words];
    if (sort === "az") {
      copy.sort((a, b) => a.term.localeCompare(b.term));
    } else if (sort === "level") {
      copy.sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return a.term.localeCompare(b.term);
      });
    } else {
      copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return copy;
  }, [words, sort]);

  function openWord(word: Word) {
    setSelected(word);
    setEditing(false);
    setConfirmDelete(false);
    setError(null);
    setTerm(word.term);
    setDefinition(word.definition);
    setExampleSentence(word.exampleSentence ?? "");
    setMeaningOfExampleSentence(word.meaningOfExampleSentence ?? "");
  }

  function closeModal() {
    setSelected(null);
    setEditing(false);
    setConfirmDelete(false);
    setError(null);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateWord(selected.id, {
        term,
        definition,
        exampleSentence: exampleSentence || undefined,
        meaningOfExampleSentence: meaningOfExampleSentence || undefined,
      });
      setWords((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      setSelected(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "수정에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await deleteWord(selected.id);
      setWords((prev) => prev.filter((w) => w.id !== selected.id));
      closeModal();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "삭제에 실패했어요.");
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="나의 단어장" showBack backHref="/home">
      {loading ? (
        <Spinner label="단어장을 불러오는 중..." />
      ) : (
        <div className={styles.content}>
          {words.length > 0 ? (
            <div className={styles.toolbar} ref={toolbarRef}>
              <div className={styles.sortGroup}>
                {(
                  [
                    ["recent", "최신"],
                    ["az", "A-Z"],
                    ["level", "레벨"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.sortButton} ${sort === value ? styles.sortActive : ""}`}
                    onClick={() => setSort(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={styles.toolbarRight}>
                <span className={styles.count}>{words.length}개</span>
                <div className={styles.toolbarAdd}>
                  <Button
                    size="sm"
                    fullWidth={false}
                    onClick={() => router.push("/words/add")}
                  >
                    단어 추가
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {words.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} aria-hidden>
                <IconPlus size={28} />
              </div>
              <p className={styles.emptyTitle}>아직 단어가 없어요</p>
              <p>AI로 예문을 만들어 첫 단어를 추가해 보세요.</p>
              <div className={styles.emptyAction}>
                <Button onClick={() => router.push("/words/add")}>
                  단어 추가
                </Button>
              </div>
            </div>
          ) : (
            <ul className={styles.list}>
              {sorted.map((word) => (
                <li key={word.id}>
                  <button
                    type="button"
                    className={styles.row}
                    onClick={() => openWord(word)}
                  >
                    <span className={styles.term}>{word.term}</span>
                    <span className={styles.definition}>{word.definition}</span>
                    <span
                      className={styles.badge}
                      title="퀴즈에서 ‘외웠어요’를 누르면 올라가요"
                    >
                      Lv.{word.level}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {words.length > 0 ? (
            <div className={styles.addBar} ref={addBarRef}>
              <Button onClick={() => router.push("/words/add")}>
                단어 추가
              </Button>
            </div>
          ) : null}

          {words.length > 0 ? (
            <button
              type="button"
              className={`${styles.floatFab} ${showFloatFab ? styles.floatFabVisible : ""}`}
              aria-label="단어 추가"
              onClick={() => router.push("/words/add")}
            >
              <IconPlus size={26} />
            </button>
          ) : null}
        </div>
      )}

      <Modal
        open={!!selected && !confirmDelete}
        title={editing ? "단어 수정" : (selected?.term ?? "")}
        onClose={closeModal}
        footer={
          editing ? (
            <>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                취소
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setEditing(true)}>수정</Button>
              <Button
                variant="danger"
                onClick={() => setConfirmDelete(true)}
                disabled={saving}
              >
                삭제
              </Button>
            </>
          )
        }
      >
        {error ? <p className={styles.error}>{error}</p> : null}
        {editing ? (
          <div className={styles.editForm}>
            <TextField
              label="단어"
              name="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              required
              maxLength={100}
            />
            <TextField
              label="뜻"
              name="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              required
              maxLength={150}
            />
            <TextField
              label="예문"
              name="exampleSentence"
              multiline
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              maxLength={1000}
            />
            <TextField
              label="예문 해석"
              name="meaningOfExampleSentence"
              multiline
              value={meaningOfExampleSentence}
              onChange={(e) => setMeaningOfExampleSentence(e.target.value)}
              maxLength={1000}
            />
          </div>
        ) : (
          <>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>뜻</span>
              <p className={styles.metaValue}>{selected?.definition}</p>
            </div>
            <div className={styles.metaRow}>
              <div className={styles.metaLabelRow}>
                <span className={styles.metaLabel}>레벨</span>
                <span className={styles.helpTip}>
                  <button
                    type="button"
                    className={styles.helpButton}
                    aria-label="레벨 안내"
                  >
                    <IconHelp size={16} />
                  </button>
                  <span className={styles.helpBubble} role="tooltip">
                    퀴즈에서 ‘외웠어요’를 누르면 올라가요
                  </span>
                </span>
              </div>
              <p className={styles.metaValue}>Lv.{selected?.level}</p>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>예문</span>
              <p className={styles.metaValue}>
                {selected?.exampleSentence || "없음"}
              </p>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>예문 해석</span>
              <p className={styles.metaValue}>
                {selected?.meaningOfExampleSentence || "없음"}
              </p>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={confirmDelete && !!selected}
        title="단어를 삭제할까요?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
              {saving ? "삭제 중..." : "삭제하기"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={saving}
            >
              취소
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          <strong>{selected?.term}</strong> 단어와 예문이 목록에서 사라져요.
          이 작업은 되돌릴 수 없어요.
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}
      </Modal>
    </PageShell>
  );
}

export default function WordsPage() {
  return (
    <AuthGuard>
      <WordsContent />
    </AuthGuard>
  );
}
