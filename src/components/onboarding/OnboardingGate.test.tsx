import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingGate } from "./OnboardingGate";
import { getOnboardingStatus } from "@/lib/api/onboarding";
import {
  dismissOnboarding,
  resetOnboardingSession,
} from "@/lib/onboarding/session";

const { router } = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api/onboarding", () => ({ getOnboardingStatus: vi.fn() }));

function gate(userId = 1) {
  return (
    <OnboardingGate userId={userId}>
      <div>내 단어장</div>
    </OnboardingGate>
  );
}

describe("automatic onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("redirects an empty account before showing protected content", async () => {
    vi.mocked(getOnboardingStatus).mockResolvedValue({ eligible: true });
    render(gate());
    expect(screen.queryByText("내 단어장")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/onboarding"),
    );
  });

  it("allows accounts with words through", async () => {
    vi.mocked(getOnboardingStatus).mockResolvedValue({ eligible: false });
    render(gate());
    await screen.findByText("내 단어장");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("respects skip across remounts but checks again after a new login", async () => {
    dismissOnboarding(1);
    const view = render(gate());
    await screen.findByText("내 단어장");
    expect(getOnboardingStatus).not.toHaveBeenCalled();
    view.unmount();
    resetOnboardingSession(1);
    vi.mocked(getOnboardingStatus).mockResolvedValue({ eligible: true });
    render(gate());
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/onboarding"),
    );
  });

  it("does not interpret an API error as an empty wordbook", async () => {
    vi.mocked(getOnboardingStatus).mockRejectedValue(new Error("network"));
    render(gate());
    await screen.findByText("내 단어장");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("does not redirect after the guard unmounts", async () => {
    let resolve!: (value: { eligible: boolean }) => void;
    vi.mocked(getOnboardingStatus).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = render(gate());
    view.unmount();
    resolve({ eligible: true });
    await Promise.resolve();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
