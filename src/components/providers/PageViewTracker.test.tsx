import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { PageViewTracker } from "@/components/providers/PageViewTracker";
import { recordPageView } from "@/lib/api/analytics";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/analytics", () => ({
  recordPageView: vi.fn(),
}));

describe("PageViewTracker", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(recordPageView).mockResolvedValue(undefined);
  });

  it("records the pathname for an authenticated user", async () => {
    vi.mocked(usePathname).mockReturnValue("/words");
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: {
        userId: 1,
        username: "learner",
        displayName: "학습자",
        role: "USER",
      },
      login: vi.fn(),
      signup: vi.fn(),
      updateDisplayName: vi.fn(),
      withdrawAccount: vi.fn(),
      logout: vi.fn(),
    });

    render(<PageViewTracker />);

    await waitFor(() => expect(recordPageView).toHaveBeenCalledWith("/words"));
  });

  it("does not record a page before authentication", () => {
    vi.mocked(usePathname).mockReturnValue("/login");
    vi.mocked(useAuth).mockReturnValue({
      status: "unauthenticated",
      user: null,
      login: vi.fn(),
      signup: vi.fn(),
      updateDisplayName: vi.fn(),
      withdrawAccount: vi.fn(),
      logout: vi.fn(),
    });

    render(<PageViewTracker />);

    expect(recordPageView).not.toHaveBeenCalled();
  });
});
