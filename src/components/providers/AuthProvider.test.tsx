import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authApi from "@/lib/api/auth";
import { AuthProvider, useAuth } from "@/components/providers/AuthProvider";
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  setStoredUser,
} from "@/lib/auth/tokens";

vi.mock("@/lib/api/auth", () => ({
  refresh: vi.fn(),
  me: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
}));

function AuthControls() {
  const { status, user, login, signup, logout } = useAuth();
  return (
    <div>
      <output data-testid="status">{status}</output>
      <output data-testid="user">{user?.displayName ?? "none"}</output>
      <button
        onClick={() =>
          void login({ username: "learner", password: "pass1234" })
        }
      >
        login
      </button>
      <button
        onClick={() =>
          void signup({
            username: "new-user",
            password: "pass1234",
            displayName: "새 사용자",
          })
        }
      >
        signup
      </button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <AuthControls />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  const user = {
    userId: 1,
    username: "learner",
    displayName: "학습자",
    role: "USER" as const,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    clearAuthStorage();
  });

  it("restores the signed-in state from a successful startup refresh", async () => {
    setStoredUser(user);
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: "restored-token",
      tokenType: "Bearer",
    });
    vi.mocked(authApi.me).mockResolvedValue({
      userId: user.userId,
      username: user.username,
      role: "ADMIN",
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("학습자");
    expect(authApi.refresh).toHaveBeenCalledTimes(1);
    expect(authApi.me).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe("restored-token");
    expect(getStoredUser()?.role).toBe("ADMIN");
  });

  it("becomes unauthenticated when startup refresh fails", async () => {
    vi.mocked(authApi.refresh).mockRejectedValue(new Error("expired"));

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(getAccessToken()).toBeNull();
  });

  it("stores access token and user information after login", async () => {
    vi.mocked(authApi.refresh).mockRejectedValue(new Error("no cookie"));
    vi.mocked(authApi.login).mockResolvedValue({
      ...user,
      accessToken: "login-token",
      tokenType: "Bearer",
    });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );

    fireEvent.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(authApi.login).toHaveBeenCalledWith({
      username: "learner",
      password: "pass1234",
    });
    expect(getAccessToken()).toBe("login-token");
    expect(getStoredUser()).toEqual(user);
  });

  it("signs in automatically after signup", async () => {
    vi.mocked(authApi.refresh).mockRejectedValue(new Error("no cookie"));
    vi.mocked(authApi.signup).mockResolvedValue({
      id: 1,
      username: "new-user",
      displayName: "새 사용자",
    });
    vi.mocked(authApi.login).mockResolvedValue({
      userId: 1,
      username: "new-user",
      displayName: "새 사용자",
      role: "USER",
      accessToken: "signup-token",
      tokenType: "Bearer",
    });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );

    fireEvent.click(screen.getByRole("button", { name: "signup" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(authApi.signup).toHaveBeenCalledWith({
      username: "new-user",
      password: "pass1234",
      displayName: "새 사용자",
    });
    expect(authApi.login).toHaveBeenCalledWith({
      username: "new-user",
      password: "pass1234",
    });
    expect(getAccessToken()).toBe("signup-token");
  });

  it("calls the logout API and clears local authentication", async () => {
    setStoredUser(user);
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: "restored-token",
      tokenType: "Bearer",
    });
    vi.mocked(authApi.me).mockResolvedValue({
      userId: user.userId,
      username: user.username,
      role: user.role,
    });
    vi.mocked(authApi.logout).mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );

    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });
});
