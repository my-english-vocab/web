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

  it("groups words from oldest to newest regardless of API response order", () => {
    const latestFirst = words(31).reverse();

    const sets = createQuizSets(latestFirst);

    expect(sets.flatMap((set) => set.words).map((word) => word.id)).toEqual(
      Array.from({ length: 31 }, (_, index) => index + 1),
    );
    expect(latestFirst.map((word) => word.id)).toEqual(
      Array.from({ length: 31 }, (_, index) => 31 - index),
    );
  });

  it("places a newly added word at the end of the last set", () => {
    const existingWords = words(31);
    const newWord: Word = {
      ...existingWords[0],
      id: 32,
      term: "new-word",
      createdAt: "2026-08-25T00:00:00Z",
    };

    const sets = createQuizSets([newWord, ...existingWords].reverse());

    expect(sets.map((set) => set.words.length)).toEqual([20, 12]);
    expect(sets.at(-1)?.words.at(-1)?.id).toBe(newWord.id);
  });

  it("uses the word id as a stable order when creation times are equal", () => {
    const sameTimeWords = words(3)
      .map((word) => ({ ...word, createdAt: "2026-08-24T00:00:00Z" }))
      .reverse();

    const sets = createQuizSets(sameTimeWords);

    expect(sets[0].words.map((word) => word.id)).toEqual([1, 2, 3]);
  });
});
