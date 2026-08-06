"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import { Spinner } from "@/components/ui/Spinner";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api/client";
import styles from "../(auth)/auth.module.css";

export default function SignupPage() {
  const { status, signup } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <PageShell hideHeader>
        <Spinner label="잠시만요..." />
      </PageShell>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup({ username, password, displayName });
      router.replace("/home");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "회원가입에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell showBack backHref="/login" title="회원가입">
      <div className={styles.authLayout}>
        <div className={styles.brandBlock} style={{ marginTop: 4 }}>
          <div className={styles.brandMark}>
            <span className={styles.brandDot} aria-hidden />
            <span className={styles.brand}>My English Vocab</span>
          </div>
          <h2 className={styles.headline}>시작해볼까요?</h2>
          <p className={styles.subcopy}>
            이름과 아이디를 정하고, 나만의 단어장을 시작해 보세요.
          </p>
        </div>

        <div className={styles.formPanel}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {error ? <div className={styles.errorBanner}>{error}</div> : null}
            <TextField
              label="이름"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="예: 길동"
              required
              minLength={1}
              maxLength={30}
            />
            <TextField
              label="아이디"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={4}
              maxLength={20}
            />
            <TextField
              label="비밀번호"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              maxLength={50}
            />
            <div className={styles.actions}>
              <Button type="submit" disabled={submitting}>
                {submitting ? "가입 중..." : "가입하고 시작하기"}
              </Button>
            </div>
          </form>

          <p className={styles.footerLink}>
            이미 계정이 있나요? <Link href="/login">로그인</Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
