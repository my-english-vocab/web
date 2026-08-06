import {
  clearAuthStorage,
  getAccessToken,
  setAccessToken,
} from "@/lib/auth/tokens";
import type { ApiErrorBody, TokenResponse } from "@/lib/api/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, fallbackMessage: string) {
    super(body?.message ?? fallbackMessage);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code ?? "UNKNOWN";
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /** Skip 401→refresh retry (used by refresh itself). */
  skipRefresh?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      clearAuthStorage();
      return false;
    }

    const data = (await res.json()) as TokenResponse;
    setAccessToken(data.accessToken);
    return true;
  } catch {
    clearAuthStorage();
    return false;
  }
}

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, skipRefresh = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (res.status === 401 && auth && !skipRefresh) {
    const ok = await ensureRefreshed();
    if (ok) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (parsed as ApiErrorBody) ?? null,
      `요청에 실패했습니다 (${res.status})`,
    );
  }

  return parsed as T;
}

export { API_BASE, ensureRefreshed };
