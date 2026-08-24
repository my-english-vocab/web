import { describe, expect, it } from "vitest";
import type { Word } from "@/lib/api/types";
import { createQuizSets } from "@/lib/quiz/sets";

function words(count: number): Word[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    term: `word-${index + 1}`,
    definition: `뜻-${index + 1}`,
    level: 0,
    favorite: false,
    exampleSentence: null,
    meaningOfExampleSentence: null,
    createdAt: `2026-08-24T00:00:${String(index).padStart(2, "0")}Z`,
  }));
}

describe("createQuizSets", () => {
  it.each([
    { count: 10, sizes: [10] },
    { count: 20, sizes: [20] },
    { count: 21, sizes: [21] },
    { count: 30, sizes: [30] },
    { count: 31, sizes: [20, 11] },
    { count: 40, sizes: [20, 20] },
    { count: 41, sizes: [20, 21] },
    { count: 50, sizes: [20, 30] },
    { count: 51, sizes: [20, 20, 11] },
  ])("groups $count words into $sizes", ({ count, sizes }) => {
    const sets = createQuizSets(words(count));

    expect(sets.map((set) => set.words.length)).toEqual(sizes);
    expect(sets.flatMap((set) => set.words).map((word) => word.id)).toEqual(
      Array.from({ length: count }, (_, index) => index + 1),
    );
  });

  it("keeps one-based ranges after the last set is merged", () => {
    const sets = createQuizSets(words(50));

    expect(sets.map(({ number, start, end }) => ({ number, start, end }))).toEqual([
      { number: 1, start: 1, end: 20 },
      { number: 2, start: 21, end: 50 },
    ]);
  });
});
