import assert from "node:assert/strict";
import { test } from "node:test";
import { ownerWalletSchema } from "@/lib/agent-api/schemas";
import { authFailureMessage } from "../../features/auth/errors";
import { decideAgentAccess } from "../../lib/agent-api/decision";
import { agentBelongsToUser } from "../../lib/agent-api/ownership";
import * as demoPasskeys from "../../lib/auth/passkey-metadata";
import { cosePublicKeyFromSpki } from "../support/cose.js";
import { externalOwnerFixture } from "../support/owner-fixtures.js";
import { syntheticPasskey } from "../support/passkey-registration-fixture.js";

const demoAgent = (externalUserId: string | null) => ({
  id: "a".repeat(64),
  name: "agent",
  external_user_id: externalUserId,
  status: "ACTIVE" as const,
  deleted: false,
  owner: null,
  owner_account: null,
  archived: false,
  wallet: null,
  created_at: new Date().toISOString(),
  cooldowns: { policy_change_available_at: null, unfreeze_available_at: null },
});

test("auth feedback preserves known guidance without exposing unknown exception text", () => {
  assert.match(authFailureMessage(new Error("passkey_not_registered")), /Register one below/);
  assert.equal(
    authFailureMessage(new Error("private-provider-detail")),
    "Authentication failed. Try again.",
  );
  assert.equal(authFailureMessage(new Error("__proto__")), "Authentication failed. Try again.");
});

test("demo ownership predicate is the cross-user isolation boundary", () => {
  assert.equal(agentBelongsToUser(demoAgent("alice"), "alice"), true);
  assert.equal(agentBelongsToUser(demoAgent("alice"), "bob"), false);
  assert.equal(agentBelongsToUser(demoAgent(null), "alice"), false);
});

test("agent BFF access decisions fail closed for user, network and visibility", () => {
  const session = {
    userId: "alice",
    email: "alice@test.invalid",
    name: "Alice",
    providerId: "siwe",
    walletAddress: "0x1",
  };
  assert.deepEqual(decideAgentAccess({ session: null, networkOk: true, agent: null }), {
    ok: false,
    reason: "login_required",
  });
  assert.deepEqual(decideAgentAccess({ session, networkOk: false, agent: null }), {
    ok: false,
    reason: "network_mismatch",
  });
  assert.deepEqual(decideAgentAccess({ session, networkOk: true, agent: null }), {
    ok: false,
    reason: "agent_not_found",
  });
  // Another user's agent is indistinguishable from a missing agent.
  assert.deepEqual(
    decideAgentAccess({ session, networkOk: true, agent: demoAgent("bob") as never }),
    { ok: false, reason: "agent_not_found" },
  );
  const allowed = decideAgentAccess({
    session,
    networkOk: true,
    agent: demoAgent("alice") as never,
  });
  assert.equal(allowed.ok, true);
});

test("demo adapts Better Auth passkeys into API-compatible owner metadata", () => {
  const fixture = externalOwnerFixture("passkey");
  assert.equal(fixture.owner.type, "passkey");
  const cose = Buffer.from(cosePublicKeyFromSpki(fixture.owner.public_key));
  const publicKey = demoPasskeys.spkiFromCoseBase64(cose.toString("base64"));
  assert.equal(publicKey, fixture.owner.public_key);
  ownerWalletSchema.parse({ ...fixture.owner, public_key: publicKey });
  const registration = syntheticPasskey().registration({
    challenge: "test-challenge",
    rpId: "partner.test",
    origin: "https://partner.test",
  }) as Record<string, unknown>;
  assert.equal(demoPasskeys.coseAlgorithmFromRegistration(registration), -7);
  assert.equal(
    demoPasskeys.coseAlgorithmFromRegistration({ response: { attestationObject: "bad" } }),
    null,
  );
  assert.equal(demoPasskeys.coseAlgorithmFromRegistration({}), null);
});
