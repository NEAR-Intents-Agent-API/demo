import { McpServer } from "@modelcontextprotocol/server";
import { type AgentApi, AgentApiError } from "@near-intents-agent-api/sdk";
import { recordMcpActivity } from "@/lib/mcp/activity";
import {
  runTool,
  ToolDeniedError,
  type ToolName,
  toolDefinitions,
  toolError,
  toolResult,
} from "@/lib/mcp/tools";

export type McpIdentity = {
  clientAccessId: string;
  clientName: string;
  /** The one agent this client is bound to. */
  agentId: string;
  userId: string;
  authKind: "oauth" | "api_key";
  /** OAuth subject or API key id: which credential acted. */
  subject: string;
};

export type McpToolScope = {
  identity: McpIdentity;
  client: AgentApi;
};

/**
 * Builds one MCP server per request. Every tool is closed over this client's single
 * agent, so a tool call cannot address another agent even if a harness asks: reaching a
 * second agent means connecting to that account’s endpoint.
 *
 * Failures are returned as structured tool errors rather than thrown protocol errors: a
 * provider refusal (`policy_denied`, `approval_closed`, `policy_action_denied`) is an
 * outcome a harness must be able to read, not a transport failure.
 */
export function createAgentMcpServer(scope: McpToolScope): McpServer {
  const server = new McpServer(
    { name: `near-agent-${scope.identity.agentId.slice(0, 12)}`, version: "1.0.0" },
    {
      instructions: [
        "This server uses one NEAR Intents agent account. Its owner's rules and USD budget are shared with every other client to it. This client may do exactly what the account rules allow: an action the rules turn off fails with policy_action_denied, and transfers and withdrawals only reach destinations the rules allow (policy_destination_denied otherwise). Either way, ask the owner to change the rule; no new grant is needed. Incoming deposit addresses need no spending grant.",
        "Balances, swaps, confidential shield/unshield, cross-chain withdrawals, Intents transfers and deposit intents are available; there is no native NEAR transfer.",
        "Every write needs a unique idempotencyKey. Reusing one with different arguments is rejected.",
        "If a write returns owner_action_required, a human must approve it in the dashboard at the given url. Poll get_operation; never retry the write.",
        "A completed operation is not settlement proof. Read get_history or refresh_operation for provider evidence.",
      ].join("\n"),
    },
  );

  for (const name of Object.keys(toolDefinitions) as ToolName[]) {
    const definition = toolDefinitions[name];
    server.registerTool(
      name,
      {
        description: definition.description,
        inputSchema: definition.inputSchema,
        annotations: { title: titleFor(name) },
      },
      async (args: Record<string, unknown>) => {
        try {
          const outcome = await runTool(name, args ?? {}, {
            agentId: scope.identity.agentId,
            client: scope.client,
          });
          await recordMcpActivity({
            clientAccessId: scope.identity.clientAccessId,
            clientName: scope.identity.clientName,
            agentId: scope.identity.agentId,
            userId: scope.identity.userId,
            authKind: scope.identity.authKind,
            subject: scope.identity.subject,
            tool: name,
            status: outcome.status,
            operationId: outcome.operationId,
          });
          return toolResult(outcome.result);
        } catch (error) {
          const code = errorCode(error);
          await recordMcpActivity({
            clientAccessId: scope.identity.clientAccessId,
            clientName: scope.identity.clientName,
            agentId: scope.identity.agentId,
            userId: scope.identity.userId,
            authKind: scope.identity.authKind,
            subject: scope.identity.subject,
            tool: name,
            status: "error",
            detail: code,
          });
          return toolError(code);
        }
      },
    );
  }

  return server;
}

function titleFor(name: string): string {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** SDK errors carry an API code; arbitrary thrown values stay opaque to the harness. */
function errorCode(error: unknown): string {
  if (error instanceof AgentApiError || error instanceof ToolDeniedError) return error.code;
  return "tool_failed";
}
