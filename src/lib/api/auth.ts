import { apiRequest } from "@/lib/api/client";
import type {
  LoginRequest,
  LoginResponse,
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

export function refresh(refreshToken: string) {
  return apiRequest<TokenResponse>("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    auth: false,
    skipRefresh: true,
  });
}

export function logout(refreshToken: string) {
  return apiRequest<void>("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
    auth: false,
    skipRefresh: true,
  });
}
