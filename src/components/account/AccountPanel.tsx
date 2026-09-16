"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ApiError } from "@/lib/api/client";
import styles from "./AccountPanel.module.css";

type AccountPanelProps = {
  onClose: () => void;
  onRestartOnboarding: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

type GlyphName = "spark" | "dashboard" | "logout" | "trash";

function Glyph({ name }: { name: GlyphName }) {
  if (name === "spark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
        <path d="m18.5 16 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
      </svg>
    );
  }
  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </svg>
    );
  }
  if (name === "logout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10M14.5 8l4 4-4 4M8.5 12h10" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M5 7h14M9 7V4.8h6V7m2 0-.7 12H7.7L7 7m3 3v6m4-6v6" />
    </svg>
  );
}

export function AccountPanel({
  onClose,
  onRestartOnboarding,
  returnFocusRef,
}: AccountPanelProps) {
  const { user, updateDisplayName, withdrawAccount, logout } = useAuth();
  const router = useRouter();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [confirmingWithdrawal, setConfirmingWithdrawal] = useState(false);
  const [password, setPassword] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const busy = savingName || withdrawing || loggingOut;
  const busyRef = useRef(busy);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    if (!user) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocus = returnFocusRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      returnFocus?.focus();
    };
  }, [user, onClose, returnFocusRef]);

  if (!user) return null;

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    const nextName = displayName.trim();
    if (!nextName) {
      setNameError("이름을 입력해 주세요.");
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      await updateDisplayName(nextName);
      setDisplayName(nextName);
      setEditingName(false);
    } catch (error) {
      setNameError(
        error instanceof ApiError
          ? error.message
          : "이름을 저장하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setSavingName(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  async function handleWithdraw(event: React.FormEvent) {
    event.preventDefault();
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      await withdrawAccount(password);
      router.replace("/login");
    } catch (error) {
      setWithdrawError(
        error instanceof ApiError && error.code === "AUTH_INVALID_CREDENTIALS"
          ? "비밀번호가 올바르지 않습니다."
          : "회원 탈퇴를 완료하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>MY PAGE</p>
            <h2 id={titleId}>내 정보</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            disabled={busy}
            aria-label="마이페이지 닫기"
          >
            <span aria-hidden>×</span>
          </button>
        </header>

        <section className={styles.profileCard}>
          <span className={styles.avatar} aria-hidden>
            {user.displayName.trim().charAt(0) || "M"}
          </span>
          <div className={styles.identity}>
            <strong>{user.displayName}</strong>
            <span>@{user.username}</span>
          </div>
          {!editingName ? (
            <button
              type="button"
              className={styles.editButton}
              onClick={() => setEditingName(true)}
            >
              이름 수정
            </button>
          ) : null}
        </section>

        {editingName ? (
          <form className={styles.editForm} onSubmit={saveName}>
            <TextField
              label="새 이름"
              name="profileDisplayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={30}
              autoFocus
              disabled={savingName}
              error={nameError ?? undefined}
            />
            <div className={styles.inlineActions}>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDisplayName(user.displayName);
                  setEditingName(false);
                  setNameError(null);
                }}
                disabled={savingName}
              >
                취소
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingName || displayName.trim() === user.displayName}
              >
                {savingName ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        ) : null}

        <nav className={styles.accountMenu} aria-label="마이페이지 메뉴">
          <button type="button" onClick={onRestartOnboarding}>
            <span className={`${styles.menuIcon} ${styles.sparkIcon}`}>
              <Glyph name="spark" />
            </span>
            <span className={styles.menuCopy}>
              <strong>추천 단어 다시 만나기</strong>
              <small>학습 목적을 다시 고르고 10개 단어 점검</small>
            </span>
            <span className={styles.chevron} aria-hidden>›</span>
          </button>
          {user.role === "ADMIN" ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/admin");
              }}
            >
              <span className={`${styles.menuIcon} ${styles.adminIcon}`}>
                <Glyph name="dashboard" />
              </span>
              <span className={styles.menuCopy}>
                <strong>운영 대시보드</strong>
                <small>사용자와 서비스 통계 확인</small>
              </span>
              <span className={styles.chevron} aria-hidden>›</span>
            </button>
          ) : null}
          <button type="button" onClick={handleLogout} disabled={loggingOut}>
            <span className={styles.menuIcon}>
              <Glyph name="logout" />
            </span>
            <span className={styles.menuCopy}>
              <strong>{loggingOut ? "로그아웃 중..." : "로그아웃"}</strong>
              <small>현재 계정에서 안전하게 나가기</small>
            </span>
            <span className={styles.chevron} aria-hidden>›</span>
          </button>
        </nav>

        <section className={styles.dangerZone}>
          {!confirmingWithdrawal ? (
            <button
              type="button"
              className={styles.withdrawEntry}
              onClick={() => setConfirmingWithdrawal(true)}
            >
              <Glyph name="trash" /> 회원 탈퇴
            </button>
          ) : (
            <form className={styles.withdrawForm} onSubmit={handleWithdraw}>
              <div>
                <strong>정말 탈퇴하시겠어요?</strong>
                <p>저장한 단어와 학습 기록이 모두 삭제되며 복구할 수 없습니다.</p>
              </div>
              <TextField
                label="확인을 위해 비밀번호를 입력해 주세요"
                name="withdrawPassword"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={withdrawing}
                error={withdrawError ?? undefined}
              />
              <div className={styles.inlineActions}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setConfirmingWithdrawal(false);
                    setPassword("");
                    setWithdrawError(null);
                  }}
                  disabled={withdrawing}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="danger"
                  disabled={withdrawing || password.length === 0}
                >
                  {withdrawing ? "탈퇴 처리 중..." : "계정과 데이터 삭제"}
                </Button>
              </div>
            </form>
          )}
        </section>
      </aside>
    </div>
  );
}
