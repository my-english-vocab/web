"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { PageShell } from "@/components/ui/PageShell";
import { Spinner } from "@/components/ui/Spinner";

export default function RootPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/home");
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  return (
    <PageShell>
      <Spinner label="My English Vocab" />
    </PageShell>
  );
}
