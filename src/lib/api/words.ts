import { apiRequest } from "@/lib/api/client";
import type { Word, WordInput } from "@/lib/api/types";

export function getWords() {
  return apiRequest<Word[]>("/api/words");
}

export function getWord(id: number) {
  return apiRequest<Word>(`/api/words/${id}`);
}

export function createWord(data: WordInput) {
  return apiRequest<Word>("/api/words", {
    method: "POST",
    body: data,
  });
}

export function updateWord(id: number, data: WordInput) {
  return apiRequest<Word>(`/api/words/${id}`, {
    method: "PUT",
    body: data,
  });
}

export function deleteWord(id: number) {
  return apiRequest<void>(`/api/words/${id}`, {
    method: "DELETE",
  });
}

export function markLearned(id: number) {
  return apiRequest<Word>(`/api/words/${id}/mark-learned`, {
    method: "POST",
  });
}
