"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { PageShell } from "@/components/ui/PageShell";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

type AuthGuardProps = {
  children: React.ReactNode;
  skipOnboarding?: boolean;
};

export function AuthGuard({ children, skipOnboarding = false }: AuthGuardProps) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <PageShell>
        <Spinner label="불러오는 중..." />
      </PageShell>
    );
  }

  if (status !== "authenticated") {
    return (
      <PageShell>
        <Spinner label="로그인 화면으로 이동 중..." />
      </PageShell>
    );
  }

  if (skipOnboarding || !user) return <>{children}</>;
  return (
    <OnboardingGate key={user.userId} userId={user.userId}>
      {children}
    </OnboardingGate>
  );
}
