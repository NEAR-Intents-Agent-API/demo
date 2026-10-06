import type { TokenView } from "@near-intents-agent-api/sdk";
import { request } from "@/lib/http/request";

export const catalogApi = {
  catalog: () => request<{ data: TokenView[] }>("/api/tokens"),
};
