import type { Word } from "@/lib/api/types";

export const DEFAULT_QUIZ_SET_SIZE = 20;
export const LAST_SET_MERGE_THRESHOLD = 10;

export type QuizSet = {
  number: number;
  start: number;
  end: number;
  words: Word[];
};

export function createQuizSets(words: Word[]): QuizSet[] {
  if (words.length === 0) return [];

  const fullSetCount = Math.floor(words.length / DEFAULT_QUIZ_SET_SIZE);
  const remainder = words.length % DEFAULT_QUIZ_SET_SIZE;
  const shouldMergeLast =
    fullSetCount > 0 &&
    remainder > 0 &&
    remainder <= LAST_SET_MERGE_THRESHOLD;
  const sets: QuizSet[] = [];
  let cursor = 0;

  while (cursor < words.length) {
    const isMergedLastSet =
      shouldMergeLast &&
      cursor === (fullSetCount - 1) * DEFAULT_QUIZ_SET_SIZE;
    const endExclusive = isMergedLastSet
      ? words.length
      : Math.min(cursor + DEFAULT_QUIZ_SET_SIZE, words.length);

    sets.push({
      number: sets.length + 1,
      start: cursor + 1,
      end: endExclusive,
      words: words.slice(cursor, endExclusive),
    });
    cursor = endExclusive;
  }

  return sets;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}
