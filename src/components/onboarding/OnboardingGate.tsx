"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingStatus } from "@/lib/api/onboarding";
import { readSession, writeSession } from "@/lib/onboarding/session";
import { PageShell } from "@/components/ui/PageShell";
import { Spinner } from "@/components/ui/Spinner";

export function OnboardingGate({
  userId,
  children,
}: {
  userId: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (readSession(userId, "checked") === "true") {
        if (!cancelled) setAllowed(true);
        return;
      }
      try {
        const { eligible } = await getOnboardingStatus();
        if (cancelled) return;
        if (eligible) router.replace("/onboarding");
        else {
          writeSession(userId, "checked", "true");
          setAllowed(true);
        }
      } catch {
        // An optional introduction must never lock the user out on API failure.
        if (!cancelled) setAllowed(true);
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [userId, router]);

  return allowed ? (
    children
  ) : (
    <PageShell hideHeader>
      <Spinner label="단어장을 준비하고 있어요..." />
    </PageShell>
  );
}
