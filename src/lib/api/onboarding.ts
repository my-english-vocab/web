import { apiRequest } from "@/lib/api/client";

export type StarterWord = {
  id: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  term: string;
  definition: string;
  exampleSentence: string;
  meaningOfExampleSentence: string;
};

export type StarterTrack = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  words: StarterWord[];
};

export type OnboardingCatalog = { version: number; tracks: StarterTrack[] };
export type CompleteResult = { addedCount: number; existingCount: number };

export function getOnboardingStatus() {
  return apiRequest<{ eligible: boolean }>("/api/onboarding/status");
}

export function getOnboardingCatalog() {
  return apiRequest<OnboardingCatalog>("/api/onboarding/catalog");
}

export function completeOnboarding(
  version: number,
  trackId: string,
  wordIds: string[],
) {
  return apiRequest<CompleteResult>("/api/onboarding/complete", {
    method: "POST",
    body: { version, trackId, wordIds },
  });
}
