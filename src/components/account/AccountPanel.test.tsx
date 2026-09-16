import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountPanel } from "./AccountPanel";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  updateDisplayName: vi.fn(),
  withdrawAccount: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      userId: 1,
      username: "learner",
      displayName: "학습자",
      role: "USER",
    },
    updateDisplayName: mocks.updateDisplayName,
    withdrawAccount: mocks.withdrawAccount,
    logout: mocks.logout,
  }),
}));

function Panel({
  onClose = vi.fn(),
  onRestart = vi.fn(),
}: {
  onClose?: () => void;
  onRestart?: () => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef}>마이페이지</button>
      <AccountPanel
        onClose={onClose}
        onRestartOnboarding={onRestart}
        returnFocusRef={triggerRef}
      />
    </>
  );
}

describe("account panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateDisplayName.mockResolvedValue(undefined);
    mocks.withdrawAccount.mockResolvedValue(undefined);
    mocks.logout.mockResolvedValue(undefined);
  });

  it("shows account identity and saves a changed display name", async () => {
    render(<Panel />);
    expect(screen.getByText("@learner")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "이름 수정" }));
    fireEvent.change(screen.getByLabelText("새 이름"), {
      target: { value: "  새 이름  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(mocks.updateDisplayName).toHaveBeenCalledWith("새 이름"),
    );
  });

  it("keeps recommended words as a secondary panel action", () => {
    const onRestart = vi.fn();
    render(<Panel onRestart={onRestart} />);

    fireEvent.click(
      screen.getByRole("button", { name: /추천 단어 다시 만나기/ }),
    );

    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("requires a password confirmation before withdrawing", async () => {
    render(<Panel />);
    fireEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));
    expect(
      screen.getByText(/학습 기록이 모두 삭제되며 복구할 수 없습니다/),
    ).toBeVisible();
    fireEvent.change(
      screen.getByLabelText("확인을 위해 비밀번호를 입력해 주세요"),
      { target: { value: "pass1234" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "계정과 데이터 삭제" }),
    );

    await waitFor(() =>
      expect(mocks.withdrawAccount).toHaveBeenCalledWith("pass1234"),
    );
    expect(mocks.replace).toHaveBeenCalledWith("/login");
  });
});
