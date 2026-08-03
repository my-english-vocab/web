export default function RootPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "Pretendard, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 28, letterSpacing: "-0.03em" }}>
          My English Vocab
        </h1>
        <p style={{ marginTop: 12, color: "#4e5968" }}>
          Next.js 프론트엔드 초기 세팅
        </p>
      </div>
    </main>
  );
}
