import assert from "node:assert/strict";
import { test } from "node:test";
import { demoConfig, parseDemoEnv } from "../../lib/config/env";
import { configureDemoRuntime } from "../../lib/config/runtime";
import {
  type McpAgentClient,
  runReadTool,
  runWriteTool,
  toolDefinitions,
} from "../../lib/mcp/tools";

process.env.NEAR_INTENTS_AGENT_API_URL = "https://api.example.test";
process.env.NEAR_INTENTS_AGENT_API_KEY = `naa_${"a".repeat(43)}`;
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
        confidential: false,
      },
      { idempotencyKey: swap.idempotencyKey },
    ],
  ]);
  assert.equal(result.status, "PENDING_APPROVAL");
  assert.match(JSON.stringify(result.result), /tab=activity/);
});

test("MCP deposits pass both modes and refund addresses without recipient grants", async () => {
  const calls: unknown[][] = [];
  const client = {
    deposit: async (...args: unknown[]) => {
      calls.push(args);
      return { ...operation, type: "deposit", status: "PENDING_DEPOSIT" };
    },
  } as unknown as McpAgentClient;
  for (const confidential of [false, true]) {
    await runWriteTool(
      "create_cross_chain_deposit",
      {
        source_asset: "nep141:btc.omft.near",
        amount: "100",
        refund_address: "bc1qfunder",
        confidential,
        idempotencyKey: `mcp-deposit-${confidential}`,
      },
      { agentId, client },
    );
    assert.deepEqual(calls.at(-1), [
      agentId,
      {
        amount: "100",
        origin_asset: "nep141:btc.omft.near",
        destination_asset: undefined,
        refund_to: "bc1qfunder",
        confidential,
      },
      { idempotencyKey: `mcp-deposit-${confidential}` },
    ]);
  }
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
        intent_id: "intent-1",
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
      // No other account or id rides along to be mistaken for the destination.
      assert.ok(!JSON.stringify(payload).includes("c".repeat(64)));
      assert.ok(!JSON.stringify(payload).includes("intent-1"));
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
