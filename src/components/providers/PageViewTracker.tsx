"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { recordPageView } from "@/lib/api/analytics";

export function PageViewTracker() {
  const pathname = usePathname();
  const { status, user } = useAuth();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !user || !pathname) {
      return;
    }

    const trackingKey = `${user.userId}:${pathname}`;
    if (lastTracked.current === trackingKey) {
      return;
    }
    lastTracked.current = trackingKey;

    recordPageView(pathname).catch(() => {
      // 통계 기록 실패가 사용자의 화면 이용을 막아서는 안 됩니다.
    });
  }, [pathname, status, user]);

  return null;
}
