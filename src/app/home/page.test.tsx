import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "./page";
import { getWords } from "@/lib/api/words";
import { readSession, writeSession } from "@/lib/onboarding/session";
import type { Word } from "@/lib/api/types";

const { router } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/components/AuthGuard", () => ({
  AuthGuard: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      userId: 1,
      username: "learner",
      displayName: "학습자",
      role: "USER",
    },
    updateDisplayName: vi.fn(),
    withdrawAccount: vi.fn(),
    logout: vi.fn(),
  }),
}));
vi.mock("@/lib/api/words", () => ({ getWords: vi.fn() }));

describe("empty wordbook entry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });
  it("offers both starter words and manual entry for an empty wordbook", async () => {
    vi.mocked(getWords).mockResolvedValue([]);
    render(<HomePage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "추천 단어로 시작하기" }),
    );
    expect(router.push).toHaveBeenCalledWith("/onboarding");
    expect(
      screen.getByRole("button", { name: "첫 단어 추가하기" }),
    ).toBeVisible();
  });
  it("does not call a failed word request an empty wordbook", async () => {
    vi.mocked(getWords).mockRejectedValue(new Error("network"));
    render(<HomePage />);
    await screen.findByText(/단어 수를 불러오지 못했어요/);
    expect(
      screen.queryByRole("button", { name: "추천 단어로 시작하기" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("단어를 불러오는 중이에요"),
    ).not.toBeInTheDocument();
  });
  it("keeps existing accounts' home navigation", async () => {
    vi.mocked(getWords).mockResolvedValue([{ id: 1 } as Word]);
    render(<HomePage />);
    await screen.findByText("가볍게 한 바퀴 돌아볼까요?");
    expect(
      screen.queryByRole("button", { name: "추천 단어로 시작하기" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /단어 테스트/ })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: /추천 단어 다시 만나기/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /나의 단어장|단어 테스트/ }))
      .toHaveLength(2);
  });

  it("restarts onboarding from goal selection without re-enabling its gate", async () => {
    vi.mocked(getWords).mockResolvedValue([{ id: 1 } as Word]);
    writeSession(1, "checked", "true");
    writeSession(1, "draft", "unfinished answers");
    render(<HomePage />);
    fireEvent.click(await screen.findByRole("button", { name: "마이페이지 열기" }));
    fireEvent.click(
      screen.getByRole("button", { name: /추천 단어 다시 만나기/ }),
    );
    expect(readSession(1, "draft")).toBeNull();
    expect(readSession(1, "checked")).toBe("true");
    expect(router.push).toHaveBeenCalledWith("/onboarding");
  });
});
