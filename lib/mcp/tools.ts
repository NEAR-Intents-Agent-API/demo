import type { AgentApi, StatusResponse } from "@near-intents-agent-api/sdk";
import { z } from "zod";
import { correlationIdSchema, operationCorrelationIdSchema } from "@/lib/agent-api/schemas";
import { demoEnv } from "@/lib/config/runtime";

export type McpAgentClient = Pick<
  AgentApi,
  | "getAgent"
  | "getContainment"
  | "getBalances"
  | "getTokens"
  | "getPolicy"
  | "getStatus"
  | "listProviderRecords"
  | "listApprovals"
  | "getApproval"
  | "swap"
  | "withdraw"
  | "shield"
  | "unshield"
  | "transfer"
  | "deposit"
>;

export type ToolContext = {
  agentId: string;
  client: McpAgentClient;
};

export type ToolOutcome = {
  /** Provider or operation status used for the activity row. */
  status: string;
  operationId: string | null;
  result: unknown;
};

/** Read tools are always available; write tools are Intents/confidential execution only. */
export const READ_TOOLS = [
  "get_agent",
  "get_authorization_status",
  "get_balances",
  "get_tokens",
  "get_policy",
  "swap_quote",
  "withdraw_preview",
  "get_deposit_status",
  "get_operation",
  "refresh_operation",
  "get_history",
  "get_audit",
  "list_approvals",
  "get_approval",
] as const;

export const WRITE_TOOLS = [
  "swap",
  "shield",
  "unshield",
  "withdraw",
  "intents_transfer",
  "confidential_transfer",
  "create_cross_chain_deposit",
] as const;

export type ReadToolName = (typeof READ_TOOLS)[number];
export type WriteToolName = (typeof WRITE_TOOLS)[number];

const text = z.string().min(1).max(256);
const amount = z.string().regex(/^[0-9]{1,78}$/);
const idempotencyKey = z.string().min(8).max(128);
const operationId = correlationIdSchema;
const approvalId = z.string().min(1).max(64);

/** Shared by every write tool: an idempotency key is the double-spend guard. */
const writeArgs = { idempotencyKey };

/**
 * Tool definitions in wire form. `inputSchema` is a Zod object; the MCP server publishes
 * it as JSON Schema. No tool takes an agent id: the endpoint's resource already fixed it.
 */
export const toolDefinitions = {
  get_agent: {
    description: "Read this agent account's identity, owner, custody wallet and lifecycle state.",
    inputSchema: z.object({}),
  },
  get_authorization_status: {
    description:
      "Read API-side strict-owner enforcement, provider-boundary verification status, grants and pending or uncertain operations. Use returned cursors to read remaining pages.",
    inputSchema: z.object({ grants_after: text.optional(), operations_after: text.optional() }),
  },
  get_balances: {
    description:
      "Read multi-asset balances. `intents` is the execution lane; `confidential` is the provider's private shard.",
    inputSchema: z.object({ source: z.enum(["public", "confidential"]) }),
  },
  get_tokens: {
    description: "List the tokens the provider supports for Intents swaps and withdrawals.",
    inputSchema: z.object({}),
  },
  get_policy: {
    description:
      "Read the complete account policy, revision, provider readiness, active USD budget usage and execution delay/scheduling status.",
    inputSchema: z.object({}),
  },
  swap_quote: {
    description: "Preview a swap without executing it.",
    inputSchema: z.object({
      token_in: text,
      token_out: text,
      amount_in: amount,
      min_amount_out: amount.optional(),
      confidential: z.boolean().default(false),
    }),
  },
  withdraw_preview: {
    description: "Preview a cross-chain withdrawal without executing it.",
    inputSchema: z.object({
      token: text,
      amount,
      chain: text,
      to: text,
      memo: z.string().max(256).optional(),
      confidential: z.boolean().default(false),
    }),
  },
  get_deposit_status: {
    description:
      "Read the status of one deposit by the correlationId create_cross_chain_deposit returned. Fund the deposit only at the depositAddress this returns.",
    inputSchema: z.object({ correlationId: operationCorrelationIdSchema }),
  },
  get_operation: {
    description:
      "Read one operation by id. Poll this after an owner-gated write: provider approvals must be decided in the dashboard.",
    inputSchema: z.object({ operationId }),
  },
  refresh_operation: {
    description:
      "Re-read an operation from the provider after a pending or uncertain result. Use instead of retrying a write.",
    inputSchema: z.object({ operationId }),
  },
  get_history: {
    description: "Read provider request history for this custody wallet.",
    inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(25) }),
  },
  get_audit: {
    description:
      "Read the provider's audit trail for this wallet. Use it to verify an action the provider reports in history.",
    inputSchema: z.object({}),
  },
  list_approvals: {
    description:
      "List provider approvals waiting on the owner. Approval requires the owner's wallet or passkey in the dashboard; MCP can only observe it.",
    inputSchema: z.object({}),
  },
  get_approval: {
    description: "Read one provider approval by id.",
    inputSchema: z.object({ approvalId }),
  },
  swap: {
    description: "Execute an Intents swap under the current provider policy.",
    inputSchema: z
      .object({
        token_in: text,
        token_out: text,
        amount_in: amount,
        min_amount_out: amount.optional(),
        confidential: z.boolean().default(false),
        ...writeArgs,
      })
      .strict(),
  },
  shield: {
    description: "Move an Intents balance into the confidential shard.",
    inputSchema: z.object({ token: text, amount, ...writeArgs }).strict(),
  },
  unshield: {
    description: "Move a confidential balance back to Intents.",
    inputSchema: z.object({ token: text, amount, ...writeArgs }).strict(),
  },
  withdraw: {
    description: "Withdraw to another chain through Intents. Cross-chain settles asynchronously.",
    inputSchema: z
      .object({
        token: text,
        amount,
        chain: text,
        to: text,
        memo: z.string().max(256).optional(),
        confidential: z.boolean().default(false),
        async: z.boolean().default(false),
        ...writeArgs,
      })
      .strict(),
  },
  intents_transfer: {
    description: "Send an Intents transfer to another NEAR Intents account.",
    inputSchema: z.object({ token: text, amount, to: text, ...writeArgs }).strict(),
  },
  confidential_transfer: {
    description: "Send a confidential transfer from the private shard.",
    inputSchema: z.object({ token: text, amount, to: text, ...writeArgs }).strict(),
  },
  create_cross_chain_deposit: {
    description:
      "Get a deposit address that funds this agent account inside NEAR Intents, without a spending grant. `source_asset` is required: the exact `assetId` from get_tokens of the token being sent, never a symbol or chain name (it fixes the source chain and token, e.g. `nep141:eth.omft.near` is ETH on Ethereum, while `nep141:base.omft.near` is ETH on Base). Omit `amount` to accept any amount at or above `deposit.minAmount` until `deposit.expiresAt`; pass `amount` (the source token's smallest unit) for an exact deposit. The agent is credited `source_asset` unless `destination_asset` names another token. The user sends only to `deposit.depositAddress`, with `deposit.memo` when it is set; if the address is null, no funds are sent. A failed or late deposit refunds into this agent's own balance; there is no refund address to ask for. `correlationId` is the tracking id for get_deposit_status, never an address. Poll get_deposit_status until SUCCESS. `confidential: true` credits the private balance. Never tell a user to send funds to the agent's own chain address: only NEAR Intents balances are usable.",
    inputSchema: z
      .object({
        amount: amount.optional(),
        source_asset: text,
        destination_asset: text.optional(),
        confidential: z.boolean().default(false),
        ...writeArgs,
      })
      .strict(),
  },
} as const;

export type ToolName = keyof typeof toolDefinitions;

/**
 * The demo UI link for a decision the harness cannot make itself. Both provider approvals
 * need an owner signature, which only exists in the browser.
 */
export async function approvalsUrl(agentId: string): Promise<string> {
  return `${(await demoEnv()).MCP_ORIGIN}/agents/${encodeURIComponent(agentId)}/?tab=activity`;
}

/** MCP tool result: one JSON text block so every harness can read the same payload. */
export function toolResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload as Record<string, unknown>,
  };
}

export function toolError(code: string) {
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: JSON.stringify({ error: { code } }) }],
  };
}

/**
 * A deposit is funded at exactly one place. The payload names it `depositAddress`, offers it only
 * while the deposit waits for funds, and carries no other id or account (the agent's own NEAR
 * account, where refunds go) that a reader could mistake for a destination.
 */
function depositFunding(operation: Extract<StatusResponse, { type: "deposit" }>) {
  const details = operation.details;
  const text = (value: unknown) => (typeof value === "string" && value ? value : null);
  const waiting = operation.status === "PENDING_DEPOSIT";
  const address = waiting ? text(details.deposit_address) : null;
  const exact = text(details.amount);
  return {
    depositAddress: address,
    memo: address ? text(details.memo) : null,
    amount: exact,
    minAmount: text(details.min_amount),
    expiresAt: text(details.expires_at),
    instructions: !waiting
      ? "This deposit no longer accepts funds. Do not send anything for it."
      : address
        ? `${exact ? "Send exactly amount" : "Send any amount at or above minAmount"} to depositAddress (with memo when set), on the source asset's network, before expiresAt. A failed or late deposit refunds into this agent's balance. correlationId is only for get_deposit_status and is never an address.`
        : "No deposit address was issued. Do not send funds; poll get_deposit_status.",
  };
}

/**
 * Turns an operation result into the payload a harness sees. An operation still waiting on
 * the owner carries the exact URL where that decision happens, so the agent can tell the
 * user what to do instead of retrying.
 */
export async function describeOperation(
  agentId: string,
  operation: StatusResponse,
): Promise<Record<string, unknown>> {
  return {
    correlationId: operation.correlation_id,
    status: operation.status,
    ...(operation.type === "deposit"
      ? { deposit: depositFunding(operation) }
      : { details: operation.details }),
    ...(operation.status === "PENDING_APPROVAL"
      ? {
          owner_action_required: {
            kind: "provider_approval",
            url: await approvalsUrl(agentId),
            instructions: "Approve or reject in the dashboard, then poll get_operation.",
          },
        }
      : {}),
  };
}

/**
 * Maps one tool call to exactly one Agent API call. Reads use wallet queries or direct
 * reads; writes use `execute` with an Intents/confidential action. Anything not listed
 * here is not reachable over MCP.
 */
export async function runTool(
  name: ToolName,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  if (isReadTool(name)) return runReadTool(name, args, context);
  return runWriteTool(name, args, context);
}

export function isReadTool(name: ToolName): name is ReadToolName {
  return (READ_TOOLS as readonly string[]).includes(name);
}

/** Read tools never mutate state and never need an idempotency key. */
export async function runReadTool(
  name: ReadToolName,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const { agentId, client } = context;
  switch (name) {
    case "get_agent":
      return read(await client.getAgent(agentId));
    case "get_authorization_status":
      return read(
        await client.getContainment(agentId, {
          grants_cursor: optionalString(args.grants_after),
          operations_cursor: optionalString(args.operations_after),
        }),
      );
    case "get_balances":
      return read(
        await client.getBalances(agentId, {
          source: args.source === "confidential" ? "confidential" : "public",
        }),
      );
    case "get_tokens":
      return read(await client.getTokens());
    case "get_policy":
      return read(await client.getPolicy(agentId));
    case "swap_quote":
      return read(await client.swap(agentId, { ...swapRequest(args), dry: true }));
    case "withdraw_preview":
      return read(await client.withdraw(agentId, { ...withdrawRequest(args), dry: true }));
    case "get_deposit_status":
    case "get_operation":
    case "refresh_operation": {
      const operation = await client.getStatus(String(args.operationId ?? args.correlationId));
      if (operation.agent_id !== agentId) throw new ToolDeniedError("operation_not_found");
      return outcome(agentId, operation);
    }
    case "get_history":
      return read(
        await client.listProviderRecords(agentId, "requests", {
          limit: typeof args.limit === "number" ? args.limit : 25,
        }),
      );
    case "get_audit":
      return read(await client.listProviderRecords(agentId, "audit"));
    case "list_approvals":
      return read(await client.listApprovals(agentId));
    case "get_approval":
      return read(await client.getApproval(agentId, String(args.approvalId)));
  }
}

export class ToolDeniedError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
export async function runWriteTool(
  name: WriteToolName,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolOutcome> {
  const { agentId, client } = context;
  const options = { idempotencyKey: String(args.idempotencyKey) };
  const move = { asset: String(args.token), amount: String(args.amount) };
  let result: StatusResponse;
  switch (name) {
    case "swap":
      result = await client.swap(agentId, swapRequest(args), options);
      break;
    case "withdraw":
      result = await client.withdraw(agentId, withdrawRequest(args), options);
      break;
    case "shield":
      result = await client.shield(agentId, move, options);
      break;
    case "unshield":
      result = await client.unshield(agentId, move, options);
      break;
    case "intents_transfer":
    case "confidential_transfer":
      result = await client.transfer(
        agentId,
        {
          ...move,
          recipient: String(args.to),
          confidential: name === "confidential_transfer",
        },
        options,
      );
      break;
    case "create_cross_chain_deposit":
      result = await client.deposit(
        agentId,
        {
          amount: optionalString(args.amount),
          origin_asset: String(args.source_asset),
          destination_asset: optionalString(args.destination_asset),
          confidential: Boolean(args.confidential),
        },
        options,
      );
      break;
  }
  return outcome(agentId, result);
}
function swapRequest(args: Record<string, unknown>) {
  return {
    origin_asset: String(args.token_in),
    destination_asset: String(args.token_out),
    amount: String(args.amount_in),
    min_amount_out: optionalString(args.min_amount_out),
    confidential: Boolean(args.confidential),
  };
}
function withdrawRequest(args: Record<string, unknown>) {
  return {
    asset: String(args.token),
    amount: String(args.amount),
    chain: String(args.chain),
    recipient: String(args.to),
    memo: optionalString(args.memo),
    confidential: Boolean(args.confidential),
    async: Boolean(args.async),
  };
}
function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
function read(result: unknown): ToolOutcome {
  return { status: "read", operationId: null, result: { data: result } };
}
async function outcome(agentId: string, operation: StatusResponse): Promise<ToolOutcome> {
  return {
    status: operation.status,
    operationId: operation.correlation_id,
    result: await describeOperation(agentId, operation),
  };
}
