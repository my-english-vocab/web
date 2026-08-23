import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WordsPage from "@/app/words/page";
import type { Word } from "@/lib/api/types";
import * as wordsApi from "@/lib/api/words";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/components/AuthGuard", () => ({
  AuthGuard: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/PageShell", () => ({
  PageShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/lib/api/words", () => ({
  getWords: vi.fn(),
  updateFavorite: vi.fn(),
  updateWord: vi.fn(),
  deleteWord: vi.fn(),
}));

const words: Word[] = [
  {
    id: 1,
    term: "apple",
    definition: "사과",
    level: 1,
    favorite: true,
    exampleSentence: null,
    meaningOfExampleSentence: null,
    createdAt: "2026-08-20T00:00:00Z",
  },
  {
    id: 2,
    term: "zebra",
    definition: "얼룩말",
    level: 2,
    favorite: false,
    exampleSentence: null,
    meaningOfExampleSentence: null,
    createdAt: "2026-08-22T00:00:00Z",
  },
];

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
}

describe("words page", () => {
  beforeEach(() => {
    vi.mocked(wordsApi.getWords).mockResolvedValue(words);
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("numbers the currently sorted rows from one", async () => {
    render(<WordsPage />);

    const zebraRow = await screen.findByRole("button", { name: /zebra/ });
    const appleRow = screen.getByRole("button", { name: /apple/ });
    expect(within(zebraRow).getByText("1")).toBeInTheDocument();
    expect(within(appleRow).getByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "A-Z" }));

    expect(within(appleRow).getByText("1")).toBeInTheDocument();
    expect(within(zebraRow).getByText("2")).toBeInTheDocument();
  });

  it("shows only favorite words when the favorite filter is active", async () => {
    render(<WordsPage />);
    await screen.findByRole("button", { name: /zebra/ });

    fireEvent.click(screen.getByRole("button", { name: "즐겨찾기" }));

    expect(screen.getByRole("button", { name: /apple/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /zebra/ })).not.toBeInTheDocument();
    expect(screen.getByText("1개")).toBeInTheDocument();
  });

  it("toggles the selected word favorite state from the detail title", async () => {
    const updated = { ...words[1], favorite: true };
    vi.mocked(wordsApi.updateFavorite).mockResolvedValue(updated);
    render(<WordsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /zebra/ }));
    fireEvent.click(screen.getByRole("button", { name: "즐겨찾기 추가" }));

    await waitFor(() =>
      expect(wordsApi.updateFavorite).toHaveBeenCalledWith(2, true),
    );
    expect(
      await screen.findByRole("button", { name: "즐겨찾기 해제" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
