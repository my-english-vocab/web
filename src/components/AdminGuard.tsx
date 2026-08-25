"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { PageShell } from "@/components/ui/PageShell";
import { Spinner } from "@/components/ui/Spinner";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && user?.role !== "ADMIN") {
      router.replace("/home");
    }
  }, [router, status, user]);

  if (status === "loading") {
    return (
      <PageShell>
        <Spinner label="관리자 권한을 확인하는 중..." />
      </PageShell>
    );
  }

  if (status !== "authenticated" || user?.role !== "ADMIN") {
    return (
      <PageShell>
        <Spinner label="접근 가능한 화면으로 이동 중..." />
      </PageShell>
    );
  }

  return <>{children}</>;
}
