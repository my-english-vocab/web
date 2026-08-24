import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import {
  completeQuizSet,
  getQuizSetAttemptSummaries,
} from "@/lib/api/quiz";

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("quiz set API", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("loads the current user's set attempt summaries", async () => {
    vi.mocked(apiRequest).mockResolvedValue([]);

    await getQuizSetAttemptSummaries();

    expect(apiRequest).toHaveBeenCalledWith("/api/quiz/sets/attempts");
  });

  it("records a completed set with its idempotency key", async () => {
    vi.mocked(apiRequest).mockResolvedValue([]);
    const input = {
      attemptId: "9dc77d66-0364-4f86-b40c-a0e49e514d44",
      wordCount: 20,
      learnedCount: 13,
    };

    await completeQuizSet(2, input);

    expect(apiRequest).toHaveBeenCalledWith("/api/quiz/sets/2/attempts", {
      method: "POST",
      body: input,
    });
  });
});
