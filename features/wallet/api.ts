import type { ApprovalView } from "@near-intents-agent-api/sdk";
import { request } from "@/lib/http/request";

export const walletApi = {
  approvals: (agentId: string) =>
    request<{ data: ApprovalView[] }>(`/api/agents/${agentId}/approvals`),
};
