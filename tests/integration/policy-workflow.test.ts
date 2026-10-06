import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { AgentApi, type GenerateIntentResponse } from "@near-intents-agent-api/sdk";
import { createOwnerIntents } from "../../lib/agent-api/intents";
import { user } from "../../lib/db/schema";
import { createDemoTestDatabase } from "../../lib/db/testing";
import { transferPolicy } from "../support/policies";

test("intent correlation survives restart and lost submission; other users cannot resume", async () => {
  const directory = await mkdtemp(join(tmpdir(), "demo-intent-"));
  let database = await createDemoTestDatabase(directory);
  const generated: GenerateIntentResponse = {
    correlation_id: "b".repeat(64),
    agent_id: "a".repeat(64),
    type: "policy_update",
    status: "PENDING_SIGNATURE",
    expires_at: new Date(Date.now() + 600_000).toISOString(),
    signer: { type: "near", account_id: "owner.near", public_key: `ed25519:${"1".repeat(32)}` },
    intent: {
      standard: "nep413",
      payload: {
        message: "exact bytes",
        nonce: Buffer.alloc(32).toString("base64"),
        recipient: "api.test",
      },
    },
    preview: { summary: "Update policy" },
  };
  let submitted = false;
  let submissions = 0;
  const statusQueries: string[] = [];
  const api = new AgentApi({
    baseUrl: "https://api.test",
    apiKey: `naa_${"a".repeat(43)}`,
    fetch: async (input, init) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("generate-intent")) return Response.json(generated);
      if (path.endsWith("submit-intent")) {
        submissions++;
        const body = JSON.parse(String(init?.body));
        assert.equal(body.correlation_id, generated.correlation_id);
        assert.deepEqual(body.signed_data.payload, generated.intent.payload);
        submitted = true;
        throw new Error("lost_response");
      }
      statusQueries.push(new URL(String(input)).search);
      return Response.json({
        correlation_id: generated.correlation_id,
        agent_id: generated.agent_id,
        type: "policy_update",
        status: submitted ? "SUCCESS" : "PENDING_SIGNATURE",
        failure_code: null,
        details: { revision: submitted ? 2 : null },
        created_at: "",
        updated_at: "",
      });
    },
  });
  try {
    await database.db
      .insert(user)
      .values({ id: "user-a", name: "Owner", email: "owner@example.test" });
    const service = () => createOwnerIntents(database, api);
    const prepared = await service().generate("user-a", {
      type: "policy_update",
      agent_id: generated.agent_id,
      policy: transferPolicy({ recipient: "receiver.near" }),
      expected_revision: 1,
    });
    const signedData = {
      ...generated.intent,
      standard: "nep413" as const,
      payload: generated.intent.payload as Extract<
        GenerateIntentResponse["intent"],
        { standard: "nep413" }
      >["payload"],
      public_key: generated.signer.type === "near" ? generated.signer.public_key : "",
      signature: "a".repeat(128),
    };
    await assert.rejects(
      service().submit("user-b", generated.agent_id, generated.correlation_id, signedData),
      /intent_not_found/,
    );
    assert.equal(submissions, 0);
    await assert.rejects(
      service().submit("user-a", generated.agent_id, generated.correlation_id, signedData),
      /lost_response/,
    );
    await database.close();
    database = await createDemoTestDatabase(directory);
    assert.equal(
      await service().latest("user-a", generated.agent_id, "agent_create"),
      null,
      "latest only matches the requested intent type",
    );
    const restored = await service().latest("user-a", generated.agent_id, "policy_update", {
      waitMs: 5_000,
    });
    assert.equal(new URLSearchParams(statusQueries.at(-1)).get("wait_ms"), "5000");
    assert.equal(restored?.operation.status, "SUCCESS");
    assert.match(prepared.generated.idempotencyKey, /^[0-9a-f-]{36}$/);
    assert.deepEqual(prepared.generated, {
      ...generated,
      idempotencyKey: prepared.generated.idempotencyKey,
    });
    assert.deepEqual(restored?.generated, prepared.generated);
    assert.equal(submissions, 1, "recovery observes status without requesting another signature");
  } finally {
    await database.close();
    await rm(directory, { recursive: true, force: true });
  }
});
