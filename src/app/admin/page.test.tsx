import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/components/providers/AuthProvider";
import AdminDashboardPage from "@/app/admin/page";
import {
  getAdminAccountLifecycle,
  getAdminDailyStatistics,
  getAdminMonthlyStatistics,
  getAdminOverview,
  getAdminPopularPages,
  getAdminPopularWords,
  getAdminUsers,
} from "@/lib/api/admin";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/admin", () => ({
  getAdminOverview: vi.fn(),
  getAdminDailyStatistics: vi.fn(),
  getAdminMonthlyStatistics: vi.fn(),
  getAdminPopularWords: vi.fn(),
  getAdminPopularPages: vi.fn(),
  getAdminUsers: vi.fn(),
  getAdminAccountLifecycle: vi.fn(),
}));

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: {
        userId: 2,
        username: "hyungyu123",
        displayName: "현규",
        role: "ADMIN",
      },
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(getAdminOverview).mockResolvedValue({
      totalAccounts: 2,
      activeAccounts: 2,
      withdrawnAccounts: 0,
      legacyAccountsWithoutSignupDate: 2,
      newSignupsLast7Days: 0,
      wordUsersLast7Days: 1,
      totalSavedWords: 34,
      averageWordsPerActiveAccount: 17,
      quizUsers: 1,
      mostRecentActivityAt: "2026-08-25T06:29:49Z",
      dailyActiveUsers: 1,
      monthlyActiveUsers: 1,
      totalPageViews: 7,
      pageViewsLast30Days: 7,
      totalAiGenerationRequests: 1,
      aiGenerationRequestsLast30Days: 1,
      totalWithdrawals: 0,
    });
    vi.mocked(getAdminDailyStatistics).mockResolvedValue([
      {
        date: "2026-08-25",
        newSignups: 0,
        activeUsers: 1,
        pageViews: 7,
        aiGenerationRequests: 1,
        withdrawals: 0,
      },
    ]);
    vi.mocked(getAdminMonthlyStatistics).mockResolvedValue([
      {
        month: "2026-08",
        newSignups: 0,
        activeUsers: 1,
        pageViews: 7,
        aiGenerationRequests: 1,
        withdrawals: 0,
      },
    ]);
    vi.mocked(getAdminPopularWords).mockResolvedValue([
      { term: "apple", savedCount: 2, userCount: 2 },
    ]);
    vi.mocked(getAdminPopularPages).mockResolvedValue([
      { path: "/words", viewCount: 4, userCount: 1 },
    ]);
    vi.mocked(getAdminUsers).mockResolvedValue([
      {
        userId: 2,
        username: "hyungyu123",
        displayName: "현규",
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: null,
        lastLoginAt: "2026-08-25T06:24:02Z",
        lastActiveAt: "2026-08-25T06:29:49Z",
        withdrawnAt: null,
      },
    ]);
    vi.mocked(getAdminAccountLifecycle).mockResolvedValue([]);
  });

  it("renders the administrator overview and detailed statistics", async () => {
    render(<AdminDashboardPage />);

    expect(
      await screen.findByRole("heading", { name: "서비스 현황" }),
    ).toBeInTheDocument();
    expect(screen.getByText("오늘 활성 사용자")).toBeInTheDocument();
    expect(screen.getByText("저장된 단어")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "많이 저장된 단어" }),
    ).toBeInTheDocument();
    expect(screen.getByText("apple")).toBeInTheDocument();
    expect(screen.getByText("hyungyu123")).toBeInTheDocument();
    expect(getAdminOverview).toHaveBeenCalledTimes(1);
    expect(getAdminDailyStatistics).toHaveBeenCalledWith(7);
    expect(getAdminMonthlyStatistics).toHaveBeenCalledWith(6);
  });

  it("redirects a regular user without requesting admin statistics", async () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: {
        userId: 3,
        username: "learner",
        displayName: "학습자",
        role: "USER",
      },
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });

    render(<AdminDashboardPage />);

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith("/home"));
    expect(getAdminOverview).not.toHaveBeenCalled();
  });
});
