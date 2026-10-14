import assert from "node:assert/strict";
import { test } from "node:test";
import { intentsAccount } from "../../lib/agent-api/address";
import { canonicalDestination } from "../../lib/agent-api/schemas";
import { runWriteTool } from "../../lib/mcp/tools";

test("MCP transfers send a near.com `nearcom:` address as its bare Intents account", async () => {
  const sent: Array<Record<string, unknown>> = [];
  const client = {
    transfer: async (_agentId: string, request: Record<string, unknown>) => {
      sent.push(request);
      return {
        correlation_id: "op_example",
        agent_id: "agent",
        type: "transfer",
        status: "SUCCESS",
      };
    },
  };
  const context = { agentId: "agent", client } as unknown as Parameters<typeof runWriteTool>[2];
  await runWriteTool(
    "intents_transfer",
    {
      token: "nep141:wrap.near",
      amount: "1",
      to: "nearcom:Royo.near",
      idempotencyKey: "nearcom-send",
    },
    context,
  );
  assert.equal(sent[0]?.recipient, "royo.near");
  assert.equal(sent[0]?.confidential, false);
});

test("owner-typed transfer destinations store a `nearcom:` address as its bare account", () => {
  const destination = canonicalDestination({
    action: "transfer",
    address: "nearcom:0x20B66648b41ee2c24789df95bd3129d1a6fe2367",
    confidential: true,
  });
  assert.equal(destination.address, "0x20b66648b41ee2c24789df95bd3129d1a6fe2367");
  assert.equal(intentsAccount("royo.near"), "royo.near");
});
