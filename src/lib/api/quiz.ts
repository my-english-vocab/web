import { apiRequest } from "@/lib/api/client";
import type {
  CompleteQuizSetAttemptInput,
  QuizSetAttemptSummary,
} from "@/lib/api/types";

export function getQuizSetAttemptSummaries() {
  return apiRequest<QuizSetAttemptSummary[]>("/api/quiz/sets/attempts");
}

export function completeQuizSet(
  setNumber: number,
  input: CompleteQuizSetAttemptInput,
) {
  return apiRequest<QuizSetAttemptSummary[]>(
    `/api/quiz/sets/${setNumber}/attempts`,
    {
      method: "POST",
      body: input,
    },
  );
}
