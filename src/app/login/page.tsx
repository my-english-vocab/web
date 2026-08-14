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

export default function LoginPage() {
  const { status, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
      await login({ username, password });
      router.replace("/home");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "로그인에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell hideHeader>
      <div className={styles.authLayout}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>
            <span className={styles.brandDot} aria-hidden />
            <span className={styles.brand}>My English Vocab</span>
          </div>
          <h2 className={styles.headline}>다시 만나서 반가워요</h2>
          <p className={styles.subcopy}>
            모르는 단어만 모아 두고,
            <br className={styles.mobileOnlyBreak} /> 여러 번 가볍게 훑어
            보세요.
          </p>
        </div>

        <div className={`${styles.formPanel} ${styles.formCard}`}>
          <form className={styles.form} onSubmit={handleSubmit}>
            {error ? <div className={styles.errorBanner}>{error}</div> : null}
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
              maxLength={50}
            />
            <div className={styles.actions}>
              <Button type="submit" disabled={submitting}>
                {submitting ? "로그인 중..." : "로그인"}
              </Button>
            </div>
          </form>

          <p className={styles.footerLink}>
            아직 계정이 없나요? <Link href="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
