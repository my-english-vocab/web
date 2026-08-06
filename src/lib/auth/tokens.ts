import type { AuthUser } from "@/lib/api/types";

const USER_KEY = "mev_user";

/** Access token lives in memory only (lost on full page reload until cookie refresh). */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearAuthStorage(): void {
  setAccessToken(null);
  setStoredUser(null);
  if (typeof window !== "undefined") {
    localStorage.removeItem("mev_refresh_token");
  }
}
