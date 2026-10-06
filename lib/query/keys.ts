/**
 * Cache identity for every server read in the demo. One factory per resource so a query and the
 * mutation that invalidates it can never drift apart; every key includes the agent it belongs to.
 */
export const queryKeys = {
  session: (userId: string | null) => ["session", userId] as const,
  catalog: () => ["catalog"] as const,
  agents: () => ["agents"] as const,
  agent: (agentId: string) => ["agent", agentId] as const,
  onboarding: (agentId: string) => ["onboarding", agentId] as const,
  balances: (agentId: string, source: string) => ["balances", agentId, source] as const,
  access: (agentId: string) => ["access", agentId] as const,
  destinations: (agentId: string) => ["destinations", agentId] as const,
  grants: (agentId: string) => ["grants", agentId] as const,
  policy: (agentId: string) => ["policy", agentId] as const,
  controls: (agentId: string) => ["controls", agentId] as const,
  scheduled: (agentId: string) => ["scheduled-executions", agentId] as const,
  operations: (agentId: string) => ["operations", agentId] as const,
  operation: (agentId: string, operationId: string) => ["operation", agentId, operationId] as const,
  approvals: (agentId: string) => ["approvals", agentId] as const,
  mcp: (agentId: string) => ["agent-mcp", agentId] as const,
  oauthClient: (clientId: string) => ["oauth-client", clientId] as const,
  swapQuote: (agentId: string, args: unknown) => ["swap-quote", agentId, args] as const,
  withdrawPreview: (agentId: string, args: unknown) => ["withdraw-preview", agentId, args] as const,
  workflow: (agentId: string) => ["policy-workflow", agentId] as const,
};
