import type {
  GenerateIntentResponse,
  SignedData,
  StatusResponse,
} from "@near-intents-agent-api/sdk";
import type { IntentStep } from "@/features/intents";
import { request } from "@/lib/http/request";

export type McpClientView = {
  prepared: boolean;
  oauthClientId: string | null;
  id: string;
  name: string;
  authKind: "oauth" | "api_key";
  status: "pending" | "authorized" | "revoked" | "expired";
  expiresAt: string | null;
  lastUsedAt: string | null;
  prefix: string | null;
  grantId: string | null;
  revocationPending: boolean;
};

export type McpActivityView = {
  id: string;
  clientAccessId: string | null;
  clientName: string;
  agentId: string;
  authKind: "oauth" | "api_key";
  subject: string;
  tool: string;
  status: string;
  operationId: string | null;
  detail: string | null;
  createdAt: string;
};

export type AgentMcpView = {
  endpoint: string;
  clients: McpClientView[];
  activity: McpActivityView[];
};

export type McpGrantChallenge = IntentStep & {
  clientAccessId: string;
  challengeId: string;
  submitted: boolean;
};

export type McpAuthorizationResult = {
  authorized: boolean;
  token: string | null;
  redirect_uri: string | null;
  operation?: StatusResponse;
};

export type McpRevocationResult = {
  submitted: boolean;
  revoked: boolean;
  generated: GenerateIntentResponse | null;
  operation: StatusResponse | null;
};

export const mcpApi = {
  publicClient: (clientId: string) =>
    request<{ client_id: string; client_name?: string; logo_uri?: string }>(
      `/api/mcp/public-client?client_id=${encodeURIComponent(clientId)}`,
    ),
  consent: (input: { accept: false; agentId: string; oauthQuery: string }) =>
    request<{ redirect_uri: string }>("/api/mcp/consent", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  agent: (agentId: string) => request<AgentMcpView>(`/api/agents/${agentId}/mcp`),
  challenge: (
    agentId: string,
    input: {
      name?: string;
      oauthQuery?: string;
      clientAccessId?: string;
    },
  ) =>
    request<McpGrantChallenge>(`/api/agents/${agentId}/mcp/challenge`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  authorize: (
    agentId: string,
    input: {
      clientAccessId: string;
      challengeId?: string;
      signedData?: SignedData;
      oauthQuery?: string;
    },
  ) =>
    request<McpAuthorizationResult>(`/api/agents/${agentId}/mcp/authorize`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  revokeClient: (agentId: string, clientAccessId: string, signedData?: SignedData) =>
    request<McpRevocationResult>(`/api/agents/${agentId}/mcp/clients/${clientAccessId}`, {
      method: "POST",
      body: JSON.stringify({ signedData }),
    }),
};
