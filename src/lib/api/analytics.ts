import { apiRequest } from "@/lib/api/client";

export function recordPageView(path: string) {
  return apiRequest<void>("/api/analytics/page-views", {
    method: "POST",
    body: { path },
  });
}
