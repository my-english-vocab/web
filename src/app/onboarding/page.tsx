"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/components/providers/AuthProvider";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import {
  getOnboardingCatalog,
  type OnboardingCatalog,
} from "@/lib/api/onboarding";
import { dismissOnboarding } from "@/lib/onboarding/session";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import styles from "@/components/onboarding/Onboarding.module.css";

function OnboardingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [catalog, setCatalog] = useState<OnboardingCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getOnboardingCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function skip() {
    if (user) dismissOnboarding(user.userId);
    router.replace("/home");
  }

  if (catalog && user)
    return (
      <OnboardingFlow
        key={user.userId}
        catalog={catalog}
        userId={user.userId}
      />
    );
  return (
    <main className={styles.loading}>
      {failed ? (
        <>
          <h1>단어를 불러오지 못했어요</h1>
          <p role="alert">잠시 후 다시 시도하거나, 먼저 단어장을 둘러보세요.</p>
          <Button
            onClick={() => {
              setFailed(false);
              setAttempt(attempt + 1);
            }}
          >
            다시 시도
          </Button>
        </>
      ) : (
        <Spinner label="첫 단어들을 준비하고 있어요..." />
      )}
      <Button variant="ghost" onClick={skip}>
        건너뛰기
      </Button>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard skipOnboarding>
      <OnboardingContent />
    </AuthGuard>
  );
}
