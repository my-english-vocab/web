import { apiRequest } from "@/lib/api/client";
import type {
  AdminAccountLifecycle,
  AdminDailyStatistics,
  AdminMonthlyStatistics,
  AdminOverview,
  AdminPopularPage,
  AdminPopularWord,
  AdminUser,
} from "@/lib/api/types";

const BASE_PATH = "/api/admin/statistics";

export function getAdminOverview() {
  return apiRequest<AdminOverview>(`${BASE_PATH}/overview`);
}

export function getAdminDailyStatistics(days = 7) {
  return apiRequest<AdminDailyStatistics[]>(`${BASE_PATH}/daily?days=${days}`);
}

export function getAdminMonthlyStatistics(months = 6) {
  return apiRequest<AdminMonthlyStatistics[]>(
    `${BASE_PATH}/monthly?months=${months}`,
  );
}

export function getAdminPopularWords(limit = 5) {
  return apiRequest<AdminPopularWord[]>(
    `${BASE_PATH}/popular-words?limit=${limit}`,
  );
}

export function getAdminPopularPages(days = 30, limit = 5) {
  return apiRequest<AdminPopularPage[]>(
    `${BASE_PATH}/popular-pages?days=${days}&limit=${limit}`,
  );
}

export function getAdminUsers(limit = 100) {
  return apiRequest<AdminUser[]>(`${BASE_PATH}/users?limit=${limit}`);
}

export function getAdminAccountLifecycle(limit = 20) {
  return apiRequest<AdminAccountLifecycle[]>(
    `${BASE_PATH}/account-lifecycle?limit=${limit}`,
  );
}
