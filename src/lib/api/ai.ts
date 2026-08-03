import { apiRequest } from "@/lib/api/client";
import type { AiUsageResponse } from "@/lib/api/types";

export function getAiUsage() {
  return apiRequest<AiUsageResponse>("/api/ai/usage");
}
