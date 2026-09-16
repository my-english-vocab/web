import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingFlow } from "./OnboardingFlow";
import {
  completeOnboarding,
  type OnboardingCatalog,
} from "@/lib/api/onboarding";
import { readSession, writeSession } from "@/lib/onboarding/session";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/api/onboarding", () => ({ completeOnboarding: vi.fn() }));

const catalog: OnboardingCatalog = {
  version: 1,
  tracks: [
    {
      id: "toeic",
      title: "토익 준비",
      subtitle: "TOEIC",
      description: "업무 어휘",
      words: Array.from({ length: 10 }, (_, index) => ({
        id: `word-${index}`,
        term: `term${index}`,
        definition: `뜻${index}`,
        difficulty:
          index < 2 ? "beginner" : index < 5 ? "intermediate" : "advanced",
        exampleSentence: `Example sentence ${index}.`,
        meaningOfExampleSentence: `예문 해석 ${index}`,
      })),
    },
  ],
};

function start() {
  fireEvent.click(screen.getByRole("radio", { name: /토익 준비/ }));
  fireEvent.click(screen.getByRole("button", { name: /나의 첫 단어 만나기/ }));
}
function answerAll(knownCount: number) {
  for (let index = 0; index < 10; index++) {
    fireEvent.click(
      screen.getByRole("button", {
        name: index < knownCount ? /알고 있어요/ : /모르겠어요/,
      }),
    );
  }
}

describe("first wordbook flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.mocked(completeOnboarding).mockResolvedValue({
      addedCount: 6,
      existingCount: 0,
    });
  });

  it("requires a goal, reveals meaning only on request, and restores answers after reload", () => {
    const view = render(<OnboardingFlow catalog={catalog} userId={1} />);
    expect(
      screen.getByRole("button", { name: /나의 첫 단어 만나기/ }),
    ).toBeDisabled();
    start();
    expect(screen.getByText("Example sentence 0.")).toBeVisible();
    expect(screen.queryByText("뜻0")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /뜻과 해석 확인하기/ }));
    expect(screen.getByText("예문 해석 0")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /모르겠어요/ }));
    expect(screen.getByRole("heading", { name: "term1" })).toHaveFocus();
    expect(screen.queryByText("뜻1")).not.toBeInTheDocument();
    view.unmount();
    render(<OnboardingFlow catalog={catalog} userId={1} />);
    expect(screen.getByRole("heading", { name: "term1" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /이전 단어/ }));
    expect(screen.getByRole("heading", { name: "term0" })).toBeVisible();
  });

  it("supports seven goals and saves the selected new track", async () => {
    const expanded: OnboardingCatalog = {
      version: 3,
      tracks: [
        "toeic",
        "csat",
        "daily",
        "toefl",
        "opic",
        "business-email",
        "it-dev",
      ].map((id) => ({
        ...catalog.tracks[0],
        id,
        title: id === "it-dev" ? "IT·개발 문서" : id,
      })),
    };
    render(<OnboardingFlow catalog={expanded} userId={1} />);
    expect(screen.getAllByRole("radio")).toHaveLength(7);
    fireEvent.click(screen.getByRole("radio", { name: /IT·개발 문서/ }));
    expect(screen.getByText("IT·개발 문서 · 10개 단어")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: /나의 첫 단어 만나기/ }),
    );
    answerAll(9);
    fireEvent.click(
      screen.getByRole("button", { name: "1개 단어 담고 시작하기" }),
    );
    await screen.findByRole("button", { name: /내 단어장 보러 가기/ });
    expect(completeOnboarding).toHaveBeenCalledWith(3, "it-dev", ["word-9"]);
  });

  it("starts fresh when a catalog update invalidates the previous draft", () => {
    const view = render(<OnboardingFlow catalog={catalog} userId={1} />);
    start();
    fireEvent.click(screen.getByRole("button", { name: /모르겠어요/ }));
    view.unmount();
    render(<OnboardingFlow catalog={{ ...catalog, version: 3 }} userId={1} />);
    expect(
      screen.getByRole("button", { name: /나의 첫 단어 만나기/ }),
    ).toBeDisabled();
  });

  it("preselects unknown words, permits overrides, and saves only selected IDs", async () => {
    render(<OnboardingFlow catalog={catalog} userId={1} />);
    start();
    answerAll(4);
    expect(
      screen.getByRole("checkbox", { name: "term0 담기" }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "term4 담기" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "term0 담기" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "term4 담기" }));
    fireEvent.click(
      screen.getByRole("button", { name: "6개 단어 담고 시작하기" }),
    );
    await screen.findByRole("button", { name: /내 단어장 보러 가기/ });
    expect(completeOnboarding).toHaveBeenCalledWith(1, "toeic", [
      "word-5",
      "word-6",
      "word-7",
      "word-8",
      "word-9",
      "word-0",
    ]);
    expect(readSession(1, "checked")).toBe("true");
    expect(readSession(1, "draft")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: /내 단어장 보러 가기/ }),
    );
    expect(replace).toHaveBeenCalledWith("/words");
  });

  it("handles all-known and zero selection without saving unwanted words", () => {
    render(<OnboardingFlow catalog={catalog} userId={1} />);
    start();
    answerAll(10);
    expect(
      screen
        .getAllByRole("checkbox")
        .every((checkbox) => !(checkbox as HTMLInputElement).checked),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "전체 선택" }));
    expect(
      screen.getByRole("button", { name: "10개 단어 담고 시작하기" }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "전체 해제" }));
    fireEvent.click(
      screen.getByRole("button", { name: "추가하지 않고 마치기" }),
    );
    expect(completeOnboarding).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/home");
  });

  it("retains selection on failure and prevents duplicate in-flight saves", async () => {
    let rejectSave!: (error: Error) => void;
    vi.mocked(completeOnboarding).mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSave = reject;
        }),
    );
    render(<OnboardingFlow catalog={catalog} userId={1} />);
    start();
    answerAll(0);
    const save = screen.getByRole("button", {
      name: "10개 단어 담고 시작하기",
    });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(completeOnboarding).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("checkbox", { name: "term0 담기" })).toBeDisabled();
    rejectSave(new Error("network"));
    await screen.findByRole("alert");
    expect(screen.getByRole("checkbox", { name: "term0 담기" })).toBeChecked();
    fireEvent.click(
      screen.getByRole("button", { name: "10개 단어 담고 시작하기" }),
    );
    await waitFor(() => expect(completeOnboarding).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: /내 단어장 보러 가기/ });
  });

  it.each(["goal", "check", "result"])(
    "can skip the %s stage without saving",
    (stage) => {
      render(<OnboardingFlow catalog={catalog} userId={1} />);
      if (stage !== "goal") start();
      if (stage === "result") answerAll(0);
      fireEvent.click(screen.getByRole("button", { name: /건너뛰기/ }));
      expect(completeOnboarding).not.toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith("/home");
      expect(readSession(1, "checked")).toBe("true");
      expect(readSession(1, "draft")).toBeNull();
    },
  );

  it("does not reuse another account's draft or an invalid draft", () => {
    writeSession(
      2,
      "draft",
      JSON.stringify({
        version: 1,
        stage: "result",
        trackId: "toeic",
        index: 9,
        answers: Array(10).fill(false),
        selected: ["word-0"],
      }),
    );
    writeSession(1, "draft", "invalid json");
    render(<OnboardingFlow catalog={catalog} userId={1} />);
    expect(
      screen.getByRole("button", { name: /나의 첫 단어 만나기/ }),
    ).toBeDisabled();
  });
});
