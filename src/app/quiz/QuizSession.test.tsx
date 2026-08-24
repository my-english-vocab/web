import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuizSession } from "@/app/quiz/QuizSession";
import type { Word } from "@/lib/api/types";
import * as quizApi from "@/lib/api/quiz";
import * as wordsApi from "@/lib/api/words";

const replace = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, back: vi.fn() }),
}));

vi.mock("@/components/ui/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/lib/api/quiz", () => ({
  completeQuizSet: vi.fn(),
}));

vi.mock("@/lib/api/words", () => ({
  getWords: vi.fn(),
  markLearned: vi.fn(),
}));

const words: Word[] = [
  {
    id: 1,
    term: "apple",
    definition: "사과",
    level: 0,
    favorite: false,
    exampleSentence: "I ate an apple.",
    meaningOfExampleSentence: "나는 사과를 먹었다.",
    createdAt: "2026-08-24T00:00:00Z",
  },
  {
    id: 2,
    term: "banana",
    definition: "바나나",
    level: 0,
    favorite: false,
    exampleSentence: null,
    meaningOfExampleSentence: null,
    createdAt: "2026-08-24T00:01:00Z",
  },
];

describe("quiz session", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    vi.stubGlobal("crypto", {
      randomUUID: () => "9dc77d66-0364-4f86-b40c-a0e49e514d44",
    });
    vi.mocked(wordsApi.getWords).mockResolvedValue(words);
    vi.mocked(wordsApi.markLearned).mockResolvedValue(words[0]);
    vi.mocked(quizApi.completeQuizSet).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("records a completed set and keeps unknown words only for result review", async () => {
    render(<QuizSession selection="1" />);

    expect(await screen.findByText("apple")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "뜻 보기" }));
    fireEvent.click(screen.getByRole("button", { name: "모르겠어요" }));

    expect(screen.getByText("banana")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "넘기기" }));

    expect(await screen.findByText("정말 멋져요!")).toBeInTheDocument();
    await waitFor(() =>
      expect(quizApi.completeQuizSet).toHaveBeenCalledWith(1, {
        attemptId: "9dc77d66-0364-4f86-b40c-a0e49e514d44",
        wordCount: 2,
        learnedCount: 0,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "‘모르겠어요’ 단어 1개 보기" }),
    );
    expect(screen.getByText("한 번 더 눈에 담아보세요")).toBeInTheDocument();
    expect(screen.getByText("apple")).toBeInTheDocument();
    expect(screen.getByText("사과")).toBeInTheDocument();
    expect(screen.queryByText("banana")).not.toBeInTheDocument();
  });
});
