import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QuizPage from "@/app/quiz/page";
import type { Word } from "@/lib/api/types";
import * as quizApi from "@/lib/api/quiz";
import * as wordsApi from "@/lib/api/words";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/components/AuthGuard", () => ({
  AuthGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/lib/api/quiz", () => ({
  getQuizSetAttemptSummaries: vi.fn(),
}));

vi.mock("@/lib/api/words", () => ({
  getWords: vi.fn(),
}));

function createWords(count: number): Word[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    term: `word-${index + 1}`,
    definition: `뜻-${index + 1}`,
    level: 0,
    favorite: false,
    exampleSentence: null,
    meaningOfExampleSentence: null,
    createdAt: `2026-08-24T00:${String(index).padStart(2, "0")}:00Z`,
  }));
}

describe("quiz selection page", () => {
  beforeEach(() => {
    push.mockReset();
    vi.mocked(wordsApi.getWords).mockResolvedValue(createWords(51));
    vi.mocked(quizApi.getQuizSetAttemptSummaries).mockResolvedValue([
      {
        setNumber: 2,
        completedCount: 4,
        lastCompletedAt: "2026-08-24T00:00:00Z",
      },
    ]);
  });

  it("shows the full random mode and ordered set ranges with completion counts", async () => {
    render(<QuizPage />);

    expect(
      await screen.findByRole("button", { name: /전체 랜덤 퀴즈/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("3개 세트")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Set 2, 단어 21번부터 40번, 완료 4회",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Set 3, 단어 41번부터 51번, 완료 0회",
      }),
    ).toBeInTheDocument();
  });

  it("opens the selected quiz session URL", async () => {
    render(<QuizPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /전체 랜덤 퀴즈/ }),
    );
    expect(push).toHaveBeenCalledWith("/quiz/session/all");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Set 2, 단어 21번부터 40번, 완료 4회",
      }),
    );
    expect(push).toHaveBeenCalledWith("/quiz/session/2");
  });
});
