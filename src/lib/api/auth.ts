import { apiRequest } from "@/lib/api/client";
import type {
  AuthPrincipal,
  LoginRequest,
  LoginResponse,
  ProfileResponse,
  SignupRequest,
  SignupResponse,
  TokenResponse,
} from "@/lib/api/types";

export function signup(data: SignupRequest) {
  return apiRequest<SignupResponse>("/api/auth/signup", {
    method: "POST",
    body: data,
    auth: false,
  });
}

export function login(data: LoginRequest) {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: data,
    auth: false,
  });
}

/** Refresh Token은 httpOnly 쿠키로 자동 전송됩니다. */
export function refresh() {
  return apiRequest<TokenResponse>("/api/auth/refresh", {
    method: "POST",
    auth: false,
    skipRefresh: true,
  });
}

export function me() {
  return apiRequest<AuthPrincipal>("/api/auth/me");
}

export function updateProfile(displayName: string) {
  return apiRequest<ProfileResponse>("/api/auth/me", {
    method: "PATCH",
    body: { displayName },
  });
}

export function withdraw(password: string) {
  return apiRequest<void>("/api/auth/withdraw", {
    method: "POST",
    body: { password },
  });
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", {
    method: "POST",
    auth: false,
    skipRefresh: true,
  });
}
