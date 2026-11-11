import assert from "node:assert/strict";
import { test } from "node:test";
import { demoConfig, parseDemoEnv } from "../../lib/config/env";
import { configureDemoRuntime } from "../../lib/config/runtime";
import {
  type McpAgentClient,
  runReadTool,
  runWriteTool,
  toolDefinitions,
  toolError,
} from "../../lib/mcp/tools";

process.env.NEAR_INTENTS_AGENT_API_URL = "https://api.example.test";
process.env.NEAR_INTENTS_AGENT_API_KEY = "example-partner-api-key";
process.env.BETTER_AUTH_SECRET = "test-only-demo-auth-secret-32-chars";
process.env.SECRET_ENCRYPTION_KEY = "test-only-demo-encryption-key-32-chars";
configureDemoRuntime(demoConfig(parseDemoEnv(), "https://demo.example.test"));
const agentId = "a".repeat(64);
const operation = {
  correlation_id: `op_${"b".repeat(43)}`,
  agent_id: agentId,
  type: "swap",
  status: "PENDING_APPROVAL",
  details: {},
};
const swap = {
  token_in: "near",
  token_out: "usdc",
  amount_in: "100",
  idempotencyKey: "swap-12345678",
};

test("MCP maps execution fields and header options, returns owner approval link", async () => {
  const calls: unknown[][] = [];
  const client = {
    swap: async (...args: unknown[]) => {
      calls.push(args);
      return operation;
    },
  } as unknown as McpAgentClient;
  const result = await runWriteTool("swap", swap, { agentId, client });
  assert.deepEqual(calls, [
    [
      agentId,
      {
        origin_asset: "near",
        destination_asset: "usdc",
        amount: "100",
        min_amount_out: undefined,
      },
      { idempotencyKey: swap.idempotencyKey },
    ],
  ]);
  assert.equal(result.status, "PENDING_APPROVAL");
  assert.match(JSON.stringify(result.result), /tab=activity/);
});

test("MCP deposits pass an optional amount, no balance choice and no refund address", async () => {
  const calls: unknown[][] = [];
  const client = {
    deposit: async (...args: unknown[]) => {
      calls.push(args);
      return { ...operation, type: "deposit", status: "PENDING_DEPOSIT" };
    },
  } as unknown as McpAgentClient;
  for (const amount of ["100", undefined]) {
    const args = toolDefinitions.create_cross_chain_deposit.inputSchema.parse({
      source_asset: "nep141:btc.omft.near",
      ...(amount ? { amount } : {}),
      idempotencyKey: `mcp-deposit-${amount}`,
    });
    await runWriteTool("create_cross_chain_deposit", args, { agentId, client });
    assert.deepEqual(calls.at(-1), [
      agentId,
      { amount, origin_asset: "nep141:btc.omft.near", destination_asset: undefined },
      { idempotencyKey: `mcp-deposit-${amount}` },
    ]);
  }
  // The public balance is not a choice any more: the API refuses it, so the tool does not offer it.
  assert.throws(() =>
    toolDefinitions.create_cross_chain_deposit.inputSchema.parse({
      source_asset: "nep141:btc.omft.near",
      confidential: false,
      idempotencyKey: "mcp-deposit-public",
    }),
  );
  // Refunds always go to the agent's own balance; the tool has no field to send them elsewhere.
  assert.throws(() =>
    toolDefinitions.create_cross_chain_deposit.inputSchema.parse({
      source_asset: "nep141:btc.omft.near",
      refund_address: "bc1qfunder",
      idempotencyKey: "mcp-deposit-refund",
    }),
  );
});

test("MCP deposit payload names one destination, only while the deposit waits for funds", async () => {
  const correlationId = `op_${"d".repeat(43)}`;
  const address = "e74cf6848f7ca237eb941dbdcfaa826b62b50350b2d4c0e70e2ca8b3cb4b8747";
  for (const [status, depositAddress, sendTo] of [
    ["PENDING_DEPOSIT", address, address],
    ["PENDING_DEPOSIT", null, null],
    ["SUCCESS", address, null],
  ] as const) {
    const deposit = {
      ...operation,
      correlation_id: correlationId,
      type: "deposit",
      status,
      details: {
        action: "cross_chain_deposit",
        deposit_address: depositAddress,
        expires_at: "2026-10-05T12:00:00.000Z",
        near_account_id: "c".repeat(64),
        refund_to: "c".repeat(64),
        min_amount: "90",
      },
    };
    const client = {
      deposit: async () => deposit,
      getStatus: async (id: string) => ({ ...deposit, correlation_id: id }),
    } as unknown as McpAgentClient;
    const created = await runWriteTool(
      "create_cross_chain_deposit",
      { amount: "100", source_asset: "nep141:wrap.near", idempotencyKey: "deposit-funding" },
      { agentId, client },
    );
    const args = toolDefinitions.get_deposit_status.inputSchema.parse({ correlationId });
    const polled = await runReadTool("get_deposit_status", args, {
      agentId,
      client,
    });
    for (const payload of [created.result, polled.result] as Record<string, unknown>[]) {
      assert.equal(payload.correlationId, correlationId);
      assert.deepEqual(Object.keys(payload).sort(), ["correlationId", "deposit", "status"]);
      const funding = payload.deposit as Record<string, unknown>;
      assert.equal(funding.depositAddress, sendTo);
      assert.equal(funding.expiresAt, "2026-10-05T12:00:00.000Z");
      assert.equal(funding.minAmount, "90");
      // No other account (the agent itself, where refunds go) rides along as a destination.
      assert.ok(!JSON.stringify(payload).includes("c".repeat(64)));
      assert.match(
        String(funding.instructions),
        sendTo ? /never an address/ : /(Do not send|no longer accepts funds)/,
      );
    }
  }
  assert.throws(() =>
    toolDefinitions.get_deposit_status.inputSchema.parse({ correlationId: "b".repeat(64) }),
  );
});

test("MCP dry swap makes one quote call without an idempotency key", async () => {
  const calls: unknown[][] = [];
  const client = {
    swap: async (...args: unknown[]) => {
      calls.push(args);
      return { type: "swap", quote: {} };
    },
  } as unknown as McpAgentClient;
  await runReadTool("swap_quote", swap, { agentId, client });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.length, 2);
  assert.ok(calls[0]);
  assert.equal((calls[0][1] as { dry: boolean }).dry, true);
});

test("MCP correlation reads cannot expose another agent", async () => {
  const client = {
    getStatus: async () => ({ ...operation, agent_id: "other" }),
  } as unknown as McpAgentClient;
  await assert.rejects(
    runReadTool("get_operation", { operationId: operation.correlation_id }, { agentId, client }),
    /operation_not_found/,
  );
});

test("MCP passes destinations unchanged; the account's destination rule decides", async () => {
  const sent: unknown[][] = [];
  const client = {
    withdraw: async (...args: unknown[]) => {
      sent.push(args);
      return operation;
    },
  } as unknown as McpAgentClient;
  const args = {
    chain: "sol",
    to: "CaseSensitive",
    token: "near",
    amount: "1",
    idempotencyKey: "exact-destination",
  };
  await runWriteTool("withdraw", args, { agentId, client });
  assert.equal(sent.length, 1);
  assert.match(JSON.stringify(sent[0]), /"recipient":"CaseSensitive"/);
});

test("MCP NEAR withdrawals arrive as native NEAR and take no `wrapped`", async () => {
  const sent: Array<Record<string, unknown>> = [];
  const client = {
    withdraw: async (_agentId: string, request: Record<string, unknown>) => {
      sent.push(request);
      return operation;
    },
  } as unknown as McpAgentClient;
  const args = {
    chain: "near",
    to: "shop.near",
    token: "nep141:wrap.near",
    amount: "1",
    idempotencyKey: "native-near",
  };
  await runWriteTool("withdraw", args, { agentId, client });
  assert.equal("wrapped" in (sent[0] ?? {}), false);
  // The API has no wNEAR option, so neither tool takes one.
  assert.equal(toolDefinitions.withdraw.inputSchema.safeParse(args).success, true);
  assert.equal(
    toolDefinitions.withdraw.inputSchema.safeParse({ ...args, wrapped: true }).success,
    false,
  );
  assert.equal("wrapped" in toolDefinitions.withdraw_preview.inputSchema.shape, false);
});

test("MCP deposits require an exact source asset id, never a chain or symbol", async () => {
  const shape = toolDefinitions.create_cross_chain_deposit.inputSchema;
  const base = { amount: "100", idempotencyKey: "mcp-deposit-shape" };
  assert.equal(shape.safeParse(base).success, false, "source_asset is required");
  assert.equal(
    shape.safeParse({ ...base, chain: "base", token: "USDC" }).success,
    false,
    "chain plus symbol is not a deposit source",
  );
  assert.equal(shape.safeParse({ ...base, source_asset: "nep141:base.omft.near" }).success, true);
});

test("MCP withdraw previews pass the caller's idempotencyKey and otherwise leave it to the SDK", async () => {
  const sent: Array<{ request: Record<string, unknown>; key?: string }> = [];
  const client = {
    withdraw: async (
      _agentId: string,
      request: Record<string, unknown>,
      options?: { idempotencyKey?: string },
    ) => {
      sent.push({ request, key: options?.idempotencyKey });
      return { dry: true, type: "withdraw", quote: {} };
    },
  } as unknown as McpAgentClient;
  const context = { agentId: "agent", client };
  const args = { token: "nep141:wrap.near", amount: "1", chain: "near", to: "shop.near" };
  const schema = toolDefinitions.withdraw_preview.inputSchema;
  await runReadTool("withdraw_preview", schema.parse(args), context);
  await runReadTool(
    "withdraw_preview",
    schema.parse({ ...args, idempotencyKey: "preview-key-1" }),
    context,
  );
  assert.equal(sent[0]?.request.dry, true);
  assert.equal(sent[0]?.key, undefined, "the SDK creates the key");
  assert.equal(sent[1]?.key, "preview-key-1");
  assert.equal("idempotencyKey" in (sent[1]?.request ?? {}), false);
});

test("MCP tool errors carry only the code and the facts the API named", () => {
  const body = (result: ReturnType<typeof toolError>) => JSON.parse(result.content[0]?.text ?? "");
  assert.equal(toolError("policy_denied").isError, true);
  assert.deepEqual(body(toolError("policy_denied")), { error: { code: "policy_denied" } });
  assert.deepEqual(
    body(toolError("policy_change_throttled", { available_at: "2026-10-13T14:32:00.000Z" })),
    { error: { code: "policy_change_throttled", available_at: "2026-10-13T14:32:00.000Z" } },
  );
  assert.deepEqual(body(toolError("amount_too_low", { min_amount: "1000000" })), {
    error: { code: "amount_too_low", min_amount: "1000000" },
  });
  assert.deepEqual(
    body(
      toolError("insufficient_balance", {
        layer: "balance",
        available_amount: "250000",
      }),
    ),
    { error: { code: "insufficient_balance", layer: "balance", available_amount: "250000" } },
  );
  assert.deepEqual(
    body(toolError("provider_unavailable", { layer: "provider", retryable: true })),
    {
      error: { code: "provider_unavailable", layer: "provider", retryable: true },
    },
  );
  assert.deepEqual(
    body(toolError("amount_too_low", { min_amount: "1000000", pointer: "/x" } as never)),
    { error: { code: "amount_too_low", min_amount: "1000000" } },
    "unlisted facts never reach the harness",
  );
});

const order = {
  base_asset: "nep141:wrap.near",
  quote_asset: "nep141:usdc.near",
  side: "sell",
  quantity: "1000000000000000000000000",
  price: "5.2",
};

test("MCP limit orders: the quote is a dry order, the placement carries a key and a deadline", async () => {
  const calls: unknown[][] = [];
  const client = {
    placeLimitOrder: async (...args: unknown[]) => {
      calls.push(args);
      return { ...operation, type: "limit_order", status: "SUCCESS", details: { order_id: "o1" } };
    },
  } as unknown as McpAgentClient;
  const deadline = "2026-11-12T10:00:00.000Z";

  await runReadTool(
    "limit_order_quote",
    toolDefinitions.limit_order_quote.inputSchema.parse(order),
    {
      agentId,
      client,
    },
  );
  assert.deepEqual(calls.at(-1), [agentId, { ...order, deadline: undefined, dry: true }]);

  const placed = await runWriteTool(
    "place_limit_order",
    toolDefinitions.place_limit_order.inputSchema.parse({
      ...order,
      deadline,
      idempotencyKey: "order-12345678",
    }),
    { agentId, client },
  );
  assert.deepEqual(calls.at(-1), [
    agentId,
    { ...order, deadline },
    { idempotencyKey: "order-12345678" },
  ]);
  assert.equal(placed.status, "SUCCESS");
});

test("MCP limit order prices are exact decimals above zero, and a placement needs a key", () => {
  const { inputSchema } = toolDefinitions.limit_order_quote;
  for (const price of ["0", "0.0", "-1", "1e3", "01", "5.", ".5", " 5"])
    assert.equal(inputSchema.safeParse({ ...order, price }).success, false, price);
  for (const price of ["0.5", "5", "5.200", "10000.0001"])
    assert.equal(inputSchema.safeParse({ ...order, price }).success, true, price);
  assert.equal(toolDefinitions.place_limit_order.inputSchema.safeParse(order).success, false);
  assert.equal(
    toolDefinitions.place_limit_order.inputSchema.safeParse({
      ...order,
      deadline: "soon",
      idempotencyKey: "order-12345678",
    }).success,
    false,
  );
});

test("MCP cancels take no idempotency key and answer with the provider's order", async () => {
  const calls: unknown[][] = [];
  const client = {
    cancelLimitOrder: async (...args: unknown[]) => {
      calls.push(["one", ...args]);
      return { order_id: "o1" };
    },
    cancelAllLimitOrders: async (...args: unknown[]) => {
      calls.push(["all", ...args]);
      return { known: 2, cancelled: 2, failed: 0, remaining: 0, complete: true };
    },
  } as unknown as McpAgentClient;
  const one = await runWriteTool(
    "cancel_limit_order",
    toolDefinitions.cancel_limit_order.inputSchema.parse({ orderId: "o1" }),
    { agentId, client },
  );
  const all = await runWriteTool(
    "cancel_all_limit_orders",
    toolDefinitions.cancel_all_limit_orders.inputSchema.parse({}),
    { agentId, client },
  );
  assert.deepEqual(calls, [
    ["one", agentId, "o1"],
    ["all", agentId],
  ]);
  assert.equal(one.status, "cancelled");
  assert.equal(one.operationId, null);
  assert.deepEqual(all.result, {
    data: { known: 2, cancelled: 2, failed: 0, remaining: 0, complete: true },
  });
  assert.equal(
    toolDefinitions.cancel_limit_order.inputSchema.safeParse({ orderId: "o1", idempotencyKey: "x" })
      .success,
    false,
  );
});
