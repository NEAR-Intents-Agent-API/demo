import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  type AgentApi,
  AgentCreateVerificationError,
  createGrantCredential,
  type GenerateIntentRequest,
  type GenerateIntentResponse,
  type GrantView,
  type StatusResponse,
} from "@near-intents-agent-api/sdk";
import { heldGrant, storeGrantCredential } from "../../lib/agent-api/grant-credentials";
import { createOwnerIntents } from "../../lib/agent-api/intents";
import { demoConfig, parseDemoEnv } from "../../lib/config/env";
import { configureDemoRuntime } from "../../lib/config/runtime";
import { ownerIntent, user } from "../../lib/db/schema";
import { createDemoTestDatabase } from "../../lib/db/testing";

process.env.NEAR_INTENTS_AGENT_API_URL = "https://api.example.test";
process.env.NEAR_INTENTS_AGENT_API_KEY = "example-partner-api-key";
process.env.BETTER_AUTH_SECRET = "test-only-demo-auth-secret-32-chars";
process.env.SECRET_ENCRYPTION_KEY = "test-only-demo-encryption-key-32-chars";
configureDemoRuntime(demoConfig(parseDemoEnv(), "https://demo.example.test"));

// Written by the API repo and copied from the SDK's tests: responses of a real generateIntent.
const fixture = JSON.parse(
  readFileSync(new URL("../fixtures/agent-create/generated.json", import.meta.url), "utf8"),
) as {
  cases: Array<{
    request: Extract<GenerateIntentRequest, { type: "agent_create" }>;
    generated: GenerateIntentResponse;
  }>;
};

function serviceFor(database: Awaited<ReturnType<typeof createDemoTestDatabase>>, api: unknown) {
  return createOwnerIntents(database, {
    generateIntent: async () => api,
    getStatus: async () => ({ status: "PENDING_SIGNATURE" }) as StatusResponse,
  } as unknown as AgentApi);
}

test("agent_create with a grant is verified before the intent is kept or returned", async () => {
  const database = await createDemoTestDatabase();
  try {
    await database.db
      .insert(user)
      .values({ id: "owner", name: "Owner", email: "owner@test.invalid" });
    for (const { request, generated } of fixture.cases) {
      const step = await serviceFor(database, generated).generate("owner", request);
      assert.equal(step.generated.agent_id, generated.agent_id);
    }
    assert.equal((await database.db.select().from(ownerIntent)).length, fixture.cases.length);
    await database.db.delete(ownerIntent);

    const [first] = fixture.cases;
    assert.ok(first);
    // The wallet would show the owner only the hash: a grant other than the one asked for must
    // never reach it.
    const swapped = {
      ...first.request,
      grant: { ...first.request.grant, label: "Somebody else" },
    } as typeof first.request;
    await assert.rejects(
      serviceFor(database, first.generated).generate("owner", swapped),
      AgentCreateVerificationError,
    );
    const tampered = structuredClone(first.generated);
    if (tampered.preview.policy) tampered.preview.policy.frozen = true;
    await assert.rejects(
      serviceFor(database, tampered).generate("owner", first.request),
      AgentCreateVerificationError,
    );
    assert.equal((await database.db.select().from(ownerIntent)).length, 0);
  } finally {
    await database.close();
  }
});

test("the token kept for an account's first grant resolves once the API lists the grant", async () => {
  const database = await createDemoTestDatabase();
  const userId = randomBytes(8).toString("hex");
  const agentId = randomBytes(32).toString("hex");
  try {
    await database.db
      .insert(user)
      .values({ id: userId, name: "Owner", email: `${userId}@test.invalid` });
    const { token, commitment } = createGrantCredential();
    await storeGrantCredential(
      { userId, agentId, holder: "dashboard", label: "Dashboard", token, commitment },
      database,
    );
    const grant = {
      grant_id: "grant-first",
      revoked_at: null,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      credential_type: "token",
      owner_message: { credential: commitment },
      issued_via: {
        type: "agent_create",
        transaction_hash: "tx",
        policy_revision: 1,
        policy_commitment: "c".repeat(64),
      },
    } as unknown as GrantView;
    const used: string[] = [];
    const api = {
      listGrants: async () => [grant],
      forGrant: (value: string) => {
        used.push(value);
        return api;
      },
    } as unknown as AgentApi;
    const held = await heldGrant(api, { userId, agentId, holder: "dashboard" }, database);
    assert.equal(held?.grant.grant_id, "grant-first");
    assert.equal(
      createHash("sha256")
        .update(used[0] ?? "")
        .digest("hex"),
      commitment,
    );
    assert.equal(used[0], token);
  } finally {
    await database.close();
  }
});
