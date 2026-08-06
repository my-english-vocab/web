"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { AuthUser, LoginRequest, SignupRequest } from "@/lib/api/types";
import {
  clearAuthStorage,
  getStoredUser,
  setAccessToken,
  setStoredUser,
} from "@/lib/auth/tokens";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const tokens = await authApi.refresh();
        if (cancelled) return;

        setAccessToken(tokens.accessToken);

        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setStatus("authenticated");
          return;
        }

        clearAuthStorage();
        setUser(null);
        setStatus("unauthenticated");
      } catch {
        clearAuthStorage();
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    const nextUser: AuthUser = {
      userId: res.userId,
      username: res.username,
      displayName: res.displayName,
    };
    setAccessToken(res.accessToken);
    setStoredUser(nextUser);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const signup = useCallback(
    async (data: SignupRequest) => {
      await authApi.signup(data);
      await login({ username: data.username, password: data.password });
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      if (!(err instanceof ApiError)) {
        // ignore network errors on logout
      }
    } finally {
      clearAuthStorage();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({ status, user, login, signup, logout }),
    [status, user, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
