"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import { TextField } from "@/components/ui/TextField";
import { getAiUsage } from "@/lib/api/ai";
import { ApiError } from "@/lib/api/client";
import type { AiUsageResponse } from "@/lib/api/types";
import { createWord, generateExample } from "@/lib/api/words";
import styles from "./add.module.css";

function AddWordContent() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [meaningOfExampleSentence, setMeaningOfExampleSentence] = useState("");
  const [usage, setUsage] = useState<AiUsageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);

  useEffect(() => {
    getAiUsage()
      .then(setUsage)
      .catch(() => setUsage(null));
  }, []);

  async function handleGenerate() {
    if (!term.trim()) {
      setError("단어를 먼저 입력해 주세요.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const result = await generateExample(
        term.trim(),
        definition.trim() || undefined,
      );
      setDefinition(result.definition);
      setExampleSentence(result.exampleSentence);
      setMeaningOfExampleSentence(result.meaningOfExampleSentence);
      setAiFilled(true);
      const nextUsage = await getAiUsage().catch(() => null);
      if (nextUsage) setUsage(nextUsage);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "AI 예문 생성에 실패했어요.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createWord({
        term: term.trim(),
        definition: definition.trim(),
        exampleSentence: exampleSentence.trim() || undefined,
        meaningOfExampleSentence:
          meaningOfExampleSentence.trim() || undefined,
      });
      router.replace("/words");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "저장에 실패했어요.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="단어 추가" showBack backHref="/words">
      <div className={styles.page}>
        <header className={styles.intro}>
          <h2 className={styles.introTitle}>새 단어 만들기</h2>
          <p className={styles.introDesc}>
            직접 입력해 저장하거나, 필요할 때 AI로 초안을 받아 보세요.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error ? <div className={styles.error}>{error}</div> : null}

          <section className={styles.card}>
            <TextField
              label="단어"
              name="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="예: serendipity"
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
            {aiFilled ? (
              <div className={styles.previewCard}>
                AI 초안이 반영됐어요 · 수정해도 됩니다
              </div>
            ) : null}
          </section>

          <section className={styles.aiCard} aria-labelledby="ai-assist-title">
            <div className={styles.aiHeader}>
              <div className={styles.aiCopy}>
                <h3 id="ai-assist-title" className={styles.aiTitle}>
                  AI로 예문 만들기
                </h3>
                <p className={styles.aiDesc}>
                  단어만 넣어도 되고, 뜻까지 넣으면 그에 맞춰 초안을 만들어요.
                  위 칸을 채운 뒤 눌러 주세요. 저장은 아래 버튼으로 확정해요.
                </p>
              </div>
              {usage ? (
                <div className={styles.usage}>
                  <span className={styles.usageLabel}>오늘 남은 횟수</span>
                  <span className={styles.usageValue}>
                    {usage.remaining}
                    <span className={styles.usageUnit}>회</span>
                  </span>
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerate}
              disabled={generating || usage?.remaining === 0}
            >
              {generating ? "생성 중..." : "AI로 예문 만들기"}
            </Button>
          </section>

          <div className={styles.actions}>
            <Button type="submit" disabled={saving}>
              {saving ? "저장 중..." : "단어장에 저장"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/words")}
              disabled={saving}
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

export default function AddWordPage() {
  return (
    <AuthGuard>
      <AddWordContent />
    </AuthGuard>
  );
}
