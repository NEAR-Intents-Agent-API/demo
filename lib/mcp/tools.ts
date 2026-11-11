import type { AgentApi, LimitOrderRequest, StatusResponse } from "@near-intents-agent-api/sdk";
import { z } from "zod";
import { intentsAccount } from "@/lib/agent-api/address";
import {
  correlationIdSchema,
  executionNoteSchema,
  limitOrderPriceSchema,
  operationCorrelationIdSchema,
  paymentReferenceSchema,
} from "@/lib/agent-api/schemas";
import { demoEnv } from "@/lib/config/runtime";
import { ownerRiskNotice } from "@/lib/owner-risk-notice";

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
  | "placeLimitOrder"
  | "listLimitOrders"
  | "getLimitOrder"
  | "cancelLimitOrder"
  | "cancelAllLimitOrders"
  | "withdraw"
  | "shield"
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
  "limit_order_quote",
  "list_limit_orders",
  "get_limit_order",
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
  "place_limit_order",
  "cancel_limit_order",
  "cancel_all_limit_orders",
  "shield",
  "withdraw",
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

const price = limitOrderPriceSchema.describe(
  "Quote units per one whole base unit, as an exact decimal string such as 5.2.",
);

const limitOrderFields = {
  base_asset: text.describe("The asset the order buys or sells: an `assetId` from get_tokens."),
  quote_asset: text.describe("The asset the price is stated in: an `assetId` from get_tokens."),
  side: z
    .enum(["sell", "buy"])
    .describe(
      "`sell` spends `quantity` of base_asset; `buy` spends what `quantity` costs at `price`, rounded up, in quote_asset.",
    ),
  quantity: amount.describe("Amount of base_asset, in its smallest unit."),
  price,
  deadline: z.iso
    .datetime()
    .optional()
    .describe(
      "When the order stops resting, RFC 3339; at most 7 days ahead, which is also the default.",
    ),
};

/** Withdrawing is the one request that still names a balance: `false` is the public exit. */
const withdrawalBalance = z
  .boolean()
  .optional()
  .describe(
    "Omit to pay from the confidential balance. `false` pays from the legacy public balance, the only way to withdraw it.",
  );

const recipient = text.describe(
  "Recipient NEAR Intents account: a named account (alice.near), a 64-hex implicit account or a 0x EVM address. A near.com address `nearcom:<account>` is that account; the prefix is stripped.",
);

const reference = paymentReferenceSchema
  .optional()
  .describe(
    "Your label for this payment, 1 to 128 printable ASCII characters without spaces, e.g. an order id. Shared with the payee through the receipt; not sent on chain and not unique.",
  );

const note = executionNoteSchema
  .optional()
  .describe(
    "Why you run this, in your own words: 1 to 500 characters on one line. The account's owner reads it back beside what happened; it is never sent to the provider, put on chain or written into a receipt.",
  );

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
      "Read multi-asset balances. `confidential` (the default) is the account's balance: every swap, transfer, limit order and deposit runs on it. `public` is the legacy public balance, which can only be shielded or withdrawn with `confidential` false. Each entry has `balance` (what the account holds) and `available` (what it can spend now: the balance minus queued or timelocked work not yet dispatched). Plan with `available_raw`/`available`.",
    inputSchema: z.object({ source: z.enum(["public", "confidential"]).default("confidential") }),
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
    description:
      "Preview a swap without executing it. Rules and balance never refuse a preview: each one the live swap would fail comes back in `warnings` (policy_action_denied, policy_destination_denied, policy_asset_denied, policy_schedule_denied, a budget or limit code, unsupported_token, insufficient_balance with available_amount). Fix or report every warning before the live swap. `owner_approval` true means the live swap would wait in PENDING_APPROVAL for the owner.",
    inputSchema: z.object({
      token_in: text,
      token_out: text,
      amount_in: amount,
      min_amount_out: amount.optional(),
    }),
  },
  limit_order_quote: {
    description:
      "Preview a limit order without placing it. Rules and balance never refuse a preview: each one the live order would fail comes back in `warnings` (policy_action_denied, policy_asset_denied, policy_schedule_denied, a budget or limit code, insufficient_balance with available_amount, amount_too_low for an order worth under 0.1 USD, policy_price_deviation_exceeded when the price is further from the market than the policy's limit_order.max_deviation_bps, market_price_unavailable). `quote` says what the order spends and the least a full fill delivers, before 1Click's own 20 bps fee. `owner_approval` true means the live order would wait in PENDING_APPROVAL for the owner.",
    inputSchema: z.object(limitOrderFields),
  },
  list_limit_orders: {
    description:
      "List this account's limit orders, newest first, each read live from the provider: `fill_status`, `payout_status`, `is_payout_status_final`, `partial_fills`, `payouts`, `deadline` and 1Click's `app_fees`. `open: true` lists only orders that are not payout-final.",
    inputSchema: z.object({
      open: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).default(25),
      offset: z.number().int().min(0).optional(),
    }),
  },
  get_limit_order: {
    description:
      "Read one limit order by the `order_id` place_limit_order returned in details.order_id, live from the provider.",
    inputSchema: z.object({ orderId: text }),
  },
  withdraw_preview: {
    description:
      "Preview a withdrawal without executing it: the received amount is quote.amount_out. A rule the live withdrawal would fail (policy_action_denied, policy_destination_denied, a budget or limit code), an unsupported_token, an invalid_address or an insufficient_balance (with available_amount) does not refuse the preview; it comes back in `warnings`, so read them before withdrawing. `owner_approval` true means the live withdrawal would wait in PENDING_APPROVAL for the owner. `fee` ({ amount_usd, percent }) is valued only on chain near (the provider's estimate when stated in the withdrawn asset, otherwise amount minus quote.amount_out); for a bridged withdrawal it is null and quote.amount_out is in the destination chain's asset, so compare amount with quote.amount_out yourself. NEAR (nep141:wrap.near) withdrawn to chain near always arrives as native NEAR; there is no wNEAR option. Each preview runs under an idempotencyKey: pass the same key to repeat an identical preview within 60 seconds; omitted, a fresh key is used. Previews are limited to 20 per account per rolling 24 hours; a provider refusal, an outage or an uncertain attempt stays counted (only a provider rate limit, wallet_busy or provider_limit_reached gives one back), so do not repeat them needlessly. An unsupported_token or invalid_address is refused before the provider and uses none.",
    inputSchema: z.object({
      token: text,
      amount,
      chain: text,
      to: text,
      memo: z.string().max(256).optional(),
      confidential: withdrawalBalance,
      idempotencyKey: idempotencyKey.optional(),
    }),
  },
  get_deposit_status: {
    description:
      "Read the status of one deposit by the correlationId create_cross_chain_deposit returned. Fund the deposit only at the depositAddress this returns.",
    inputSchema: z.object({ correlationId: operationCorrelationIdSchema }),
  },
  get_operation: {
    description:
      "Read one operation by id. Poll this after an owner-gated write: provider approvals must be decided in the dashboard. `details.amount_out` is final and appears only on SUCCESS (or REFUNDED after a partial fill); before that, `details.expected_amount_out` is an estimate.",
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
        note,
        ...writeArgs,
      })
      .strict(),
  },
  place_limit_order: {
    description:
      "Place a resting limit order on the confidential balance (the policy needs `confidential` and `limit_order`). It is funded in full when placed and rests until it fills, is cancelled or reaches `deadline` (default and at most 7 days); fills and refunds return to the confidential balance. SUCCESS means funded and resting, not filled: `details.order_id` names it, so follow it with get_limit_order. A sell spends `quantity` of base_asset; a buy spends ceil(quantity x price) of quote_asset. The order runs the swap rules on the asset it spends (assets, limits, actions per hour, USD budget, delay, schedule, owner approval) and its price must be within the policy's limit_order.max_deviation_bps (100 when unset) of the market: policy_price_deviation_exceeded or market_price_unavailable otherwise. It must be worth at least 0.1 USD (amount_too_low). 1Click's own 20 bps fee applies to every order. Run limit_order_quote first.",
    inputSchema: z.object({ ...limitOrderFields, note, ...writeArgs }).strict(),
  },
  cancel_limit_order: {
    description:
      "Cancel one resting limit order by its order id; what is unfilled returns to the balance that funded it. Needs no idempotencyKey and works while the account is frozen or the policy no longer allows limit orders. The USD budget charged when the order was placed is not given back.",
    inputSchema: z.object({ orderId: text }).strict(),
  },
  cancel_all_limit_orders: {
    description:
      "Cancel up to 50 of this account's resting limit orders in one round. Repeat the call until `complete` is true. Needs no idempotencyKey; same exemptions as cancel_limit_order.",
    inputSchema: z.object({}).strict(),
  },
  shield: {
    description:
      "Move the legacy public balance into the confidential balance, the account's balance. Nothing moves funds back. Counts toward the asset's per-asset limits and the hourly action cap.",
    inputSchema: z.object({ token: text, amount, ...writeArgs }).strict(),
  },
  withdraw: {
    description:
      "Withdraw from the confidential balance to an address on another chain, or to a NEAR account with chain near; confidential false withdraws from the legacy public balance instead. NEAR (nep141:wrap.near) withdrawn to chain near always arrives as native NEAR; there is no wNEAR option. Cross-chain settles asynchronously. A near.com `nearcom:` address is not on any chain: send to it with a transfer instead.",
    inputSchema: z
      .object({
        token: text,
        amount,
        chain: text,
        to: text,
        memo: z.string().max(256).optional(),
        confidential: withdrawalBalance,
        async: z.boolean().default(false),
        reference,
        note,
        ...writeArgs,
      })
      .strict(),
  },
  confidential_transfer: {
    description:
      "Send from this account's confidential balance to another NEAR Intents account's confidential balance, the balance near.com shows its users. If the confidential balance is short, shield the legacy public balance first.",
    inputSchema: z
      .object({ token: text, amount, to: recipient, reference, note, ...writeArgs })
      .strict(),
  },
  create_cross_chain_deposit: {
    description:
      `Before the owner funds this account, show them this notice unaltered: ${ownerRiskNotice} ` +
      "Get a deposit address that funds this agent account inside NEAR Intents, without a spending grant. `source_asset` is required: the exact `assetId` from get_tokens of the token being sent, never a symbol or chain name (it fixes the source chain and token, e.g. `nep141:eth.omft.near` is ETH on Ethereum, while `nep141:base.omft.near` is ETH on Base). Omit `amount` to accept any amount at or above `deposit.minAmount` until `deposit.expiresAt`; pass `amount` (the source token's smallest unit) for an exact deposit. The agent is credited `source_asset` unless `destination_asset` names another token. The user sends only to `deposit.depositAddress`, with `deposit.memo` when it is set; if the address is null, no funds are sent. A failed or late deposit refunds into this agent's own balance; there is no refund address to ask for. `correlationId` is the tracking id for get_deposit_status, never an address. Poll get_deposit_status until SUCCESS. It credits the confidential balance. Never tell a user to send funds to the agent's own chain address: only NEAR Intents balances are usable.",
    inputSchema: z
      .object({
        amount: amount.optional(),
        source_asset: text,
        destination_asset: text.optional(),
        note,
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

/** The non-secret facts a refusal may carry; each is written only when the API named it. */
export type ToolErrorFacts = {
  /** The earliest time to submit again. */
  available_at?: string;
  /** Route minimum in atomic units of the asset sent, on amount_too_low. */
  min_amount?: string;
  /** Which layer refused: request, auth, grant, policy, budget, balance, provider or api. */
  layer?: string;
  /** True when the same request under the same idempotencyKey can succeed. */
  retryable?: true;
  /** Atomic units the account can spend now, on insufficient_balance. */
  available_amount?: string;
};

/**
 * MCP tool error: `{ error: { code, layer?, retryable?, available_at?, min_amount?,
 * available_amount? } }` as one JSON text block.
 */
export function toolError(code: string, facts: ToolErrorFacts = {}) {
  const error: { code: string } & ToolErrorFacts = { code };
  if (facts.layer) error.layer = facts.layer;
  if (facts.retryable) error.retryable = true;
  if (facts.available_at) error.available_at = facts.available_at;
  if (facts.min_amount) error.min_amount = facts.min_amount;
  if (facts.available_amount) error.available_amount = facts.available_amount;
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: JSON.stringify({ error }) }],
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
          source: args.source === "public" ? "public" : "confidential",
        }),
      );
    case "get_tokens":
      return read(await client.getTokens());
    case "get_policy":
      return read(await client.getPolicy(agentId));
    case "swap_quote":
      return read(await client.swap(agentId, { ...swapRequest(args), dry: true }));
    case "limit_order_quote":
      return read(await client.placeLimitOrder(agentId, { ...limitOrderRequest(args), dry: true }));
    case "list_limit_orders":
      return read(await client.listLimitOrders(agentId, limitOrderListQuery(args)));
    case "get_limit_order":
      return read(await client.getLimitOrder(agentId, String(args.orderId)));
    case "withdraw_preview":
      // A preview runs under a key like the withdrawal; the SDK creates one unless the caller sent it.
      return read(
        await client.withdraw(
          agentId,
          { ...withdrawRequest(args), dry: true },
          typeof args.idempotencyKey === "string" ? { idempotencyKey: args.idempotencyKey } : {},
        ),
      );
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
  // A cancel moves no money out and takes no key; it answers with the provider's order, not an operation.
  if (name === "cancel_limit_order")
    return cancelled(await client.cancelLimitOrder(agentId, String(args.orderId)));
  if (name === "cancel_all_limit_orders")
    return cancelled(await client.cancelAllLimitOrders(agentId));
  const options = { idempotencyKey: String(args.idempotencyKey) };
  const move = { asset: String(args.token), amount: String(args.amount) };
  let result: StatusResponse;
  switch (name) {
    case "swap":
      result = await client.swap(agentId, swapRequest(args), options);
      break;
    case "place_limit_order":
      result = await client.placeLimitOrder(agentId, limitOrderRequest(args), options);
      break;
    case "withdraw":
      result = await client.withdraw(agentId, withdrawRequest(args), options);
      break;
    case "shield":
      result = await client.shield(agentId, move, options);
      break;
    case "confidential_transfer":
      result = await client.transfer(
        agentId,
        { ...move, recipient: intentsAccount(String(args.to)), ...labels(args) },
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
          ...labels(args),
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
    ...labels(args),
  };
}
function limitOrderRequest(args: Record<string, unknown>) {
  return {
    base_asset: String(args.base_asset),
    quote_asset: String(args.quote_asset),
    side: args.side as LimitOrderRequest["side"],
    quantity: String(args.quantity),
    price: String(args.price),
    deadline: optionalString(args.deadline),
    ...labels(args),
  };
}
function limitOrderListQuery(args: Record<string, unknown>) {
  return {
    open: typeof args.open === "boolean" ? args.open : undefined,
    limit: typeof args.limit === "number" ? args.limit : 25,
    offset: typeof args.offset === "number" ? args.offset : undefined,
  };
}
function withdrawRequest(args: Record<string, unknown>) {
  return {
    asset: String(args.token),
    amount: String(args.amount),
    chain: String(args.chain),
    recipient: String(args.to),
    memo: optionalString(args.memo),
    // The confidential balance is the default; only the legacy public exit says otherwise.
    ...(args.confidential === false ? { confidential: false } : {}),
    async: Boolean(args.async),
    ...labels(args),
  };
}
/** The payment `reference` and the agent's `note`, only when the call carried them. */
function labels(args: Record<string, unknown>) {
  return {
    ...(typeof args.reference === "string" ? { reference: args.reference } : {}),
    ...(typeof args.note === "string" ? { note: args.note } : {}),
  };
}
function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
function cancelled(result: unknown): ToolOutcome {
  return { status: "cancelled", operationId: null, result: { data: result } };
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
