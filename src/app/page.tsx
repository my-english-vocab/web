import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";

export default function RootPage() {
  return (
    <PageShell>
      <div style={{ display: "grid", gap: 16, placeItems: "start" }}>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.03em", fontWeight: 800 }}>
          My English Vocab
        </h1>
        <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
          토스풍 디자인 토큰과 공통 UI 컴포넌트
        </p>
        <Button type="button">시작하기</Button>
      </div>
    </PageShell>
  );
}
