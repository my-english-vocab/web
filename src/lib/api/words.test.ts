import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import { updateFavorite } from "@/lib/api/words";

vi.mock("@/lib/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("word API", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("sends an explicit favorite state to the favorite endpoint", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ favorite: true });

    await updateFavorite(12, true);

    expect(apiRequest).toHaveBeenCalledWith("/api/words/12/favorite", {
      method: "PATCH",
      body: { favorite: true },
    });
  });
});
