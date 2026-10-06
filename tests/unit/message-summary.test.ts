import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeSignedMessage } from "../../features/wallet/model/message-summary";

/**
 * The signing summary is the last thing a person reads before approving an exact byte string.
 * These tests pin the two properties that make it safe: it never states a fact that is not in
 * the envelope, and it never silently drops an envelope it does not understand.
 */

const owner = { type: "evm", address: "0xabc", chain_id: 1 };

const control = {
  domain: "near-intents-agent-api.agent-control.v4",
  owner,
  tenant_id: "t".repeat(32),
  agent_id: "a".repeat(64),
  network: "mainnet",
  account_id: "b".repeat(64),
  public_key: "ed25519:EXAMPLE",
  recipient: "localhost",
  nonce: "n".repeat(16),
  issued_at_ms: Date.now(),
  expires_at_ms: Date.now() + 5 * 60_000,
};

test("a control envelope summarizes as agent control without inventing fields", () => {
  const summary = summarizeSignedMessage(JSON.stringify(control));
  assert.ok(summary);
  assert.equal(summary.kind, "agent control");
  const labels = summary.rows.map((row) => row.label);
  assert.ok(labels.includes("Owner (evm)"));
  assert.ok(!labels.includes("Network"));
  assert.ok(labels.includes("Agent account"));
  assert.ok(labels.includes("Expires"));
  // Every value came from the envelope, never from a default.
  for (const row of summary.rows) {
    assert.equal(typeof row.value, "string");
    assert.ok(!row.value.includes("undefined"), `no undefined leaked into ${row.label}`);
  }
});

test("a policy envelope lists the rules that actually limit spending", () => {
  const policy = {
    frozen: false,
    actions: ["swap", "transfer"],
    confidential: false,
    owner_approval: true,
    assets: ["nep141:wrap.near"],
    limits: { per_transaction: { "nep141:wrap.near": "1000000000000000000000000" } },
    max_actions_per_hour: 10,
    destinations: { mode: "only", list: [] },
    budget: { daily_usd: "25.00", weekly_usd: null, monthly_usd: null },
    timelock_ms: 90_000,
  };
  const summary = summarizeSignedMessage(
    JSON.stringify({
      ...control,
      domain: "near-intents-agent-api.owner-admin.v2",
      action: "update_policy",
      target_id: "h".repeat(64),
      policy,
      expected_revision: 4,
    }),
  );
  assert.ok(summary);
  assert.equal(summary.kind, "policy revision");
  const contents = new Map(summary.details.map((row) => [row.label, row.value]));
  assert.equal(contents.get("Frozen"), "false");
  assert.equal(contents.get("Allowed actions"), "swap, transfer");
  assert.equal(contents.get("Private balance"), "denied");
  assert.equal(contents.get("Owner approval"), "required for every move");
  assert.equal(contents.get("Allowed tokens"), "nep141:wrap.near");
  assert.equal(contents.get("Rate limit"), "10 per hour");
  assert.equal(contents.get("Per transaction limit"), "1000000000000000000000000 nep141:wrap.near");
  assert.equal(contents.get("USD budget a day"), "$25.00");
  assert.equal(contents.get("Execution delay"), "90 seconds");
  // The revision is what prevents signing against a stale policy.
  assert.equal(summary.rows.find((row) => row.label === "Expected revision")?.value, "4");
  assert.equal(summary.rows.find((row) => row.label === "Policy hash")?.value, "h".repeat(64));
});

test("a grant summary shows the exact label and token commitment; the account rules decide what it may do", () => {
  const summary = summarizeSignedMessage(
    JSON.stringify({
      ...control,
      domain: "near-intents-agent-api.agent-grant.v6",
      network: "mainnet",
      label: "MCP: claude",
      credential: "d".repeat(64),
    }),
  );
  assert.ok(summary);
  assert.equal(summary.kind, "agent grant");
  assert.equal(summary.rows.find((row) => row.label === "Grant")?.value, "MCP: claude");
  assert.equal(summary.rows.find((row) => row.label === "Token commitment")?.value, "d".repeat(64));
  const details = new Map(summary.details.map((row) => [row.label, row.value]));
  assert.match(details.get("What it may do") ?? "", /account's rules/);
});

test("owner-admin revoke and cancel name their exact target", () => {
  const admin = { ...control, domain: "near-intents-agent-api.owner-admin.v2" };
  const revoke = summarizeSignedMessage(
    JSON.stringify({ ...admin, action: "revoke_grant", target_id: "g".repeat(32) }),
  );
  assert.equal(revoke?.kind, "grant revocation");
  assert.equal(revoke?.rows.find((row) => row.label === "Grant")?.value, "g".repeat(32));
  const cancel = summarizeSignedMessage(
    JSON.stringify({ ...admin, action: "cancel_execution", target_id: "op_x" }),
  );
  assert.equal(cancel?.kind, "execution cancellation");
  assert.equal(cancel?.rows.find((row) => row.label === "Operation")?.value, "op_x");
});

test("deletion states asset loss only when the signed message confirms it", () => {
  const message = {
    ...control,
    domain: "near-intents-agent-api.agent-delete.v3",
    beneficiary: "sponsor.near",
    chain: "near",
    confirm_asset_loss: true,
  };
  const deletion = summarizeSignedMessage(JSON.stringify(message));
  assert.equal(deletion?.kind, "agent deletion");
  assert.equal(
    deletion?.details.some((row) => row.label === "Balances"),
    true,
  );
  const unconfirmed = summarizeSignedMessage(
    JSON.stringify({ ...message, confirm_asset_loss: false }),
  );
  assert.equal(unconfirmed?.details.length, 0);
});

test("domains the server no longer issues are not summarized", () => {
  for (const domain of [
    "near-intents-agent-api.agent-control.v2",
    "near-intents-agent-api.agent-delete.v2",
    "near-intents-agent-api.policy-update.v3",
  ])
    assert.equal(summarizeSignedMessage(JSON.stringify({ ...control, domain })), null);
});

test("an unrecognized or malformed envelope falls back to raw bytes only", () => {
  assert.equal(summarizeSignedMessage("not json"), null);
  assert.equal(summarizeSignedMessage(JSON.stringify({ domain: "something.else.v1" })), null);
  assert.equal(summarizeSignedMessage(JSON.stringify([1, 2, 3])), null);
  assert.equal(summarizeSignedMessage(JSON.stringify({ no_domain: true })), null);
});

test("an expired envelope is described as expired rather than as a time in the past", () => {
  const summary = summarizeSignedMessage(
    JSON.stringify({ ...control, expires_at_ms: Date.now() - 60_000 }),
  );
  assert.ok(summary);
  const expires = summary.rows.find((row) => row.label === "Expires")?.value ?? "";
  assert.match(expires, /expired/);
});

test("a local policy signature shows the destination rule it installs", () => {
  const message = {
    ...control,
    domain: "near-intents-agent-api.owner-admin.v2",
    action: "update_policy",
    policy: {
      destinations: {
        mode: "only",
        list: [
          { action: "withdraw", chain: "near", address: "exchange.near", memo: "customer-123" },
        ],
      },
    },
  };
  const policy = summarizeSignedMessage(JSON.stringify(message));
  assert.ok(policy);
  const rule = policy.details.find((row) => row.label === "Where funds can go")?.value ?? "";
  assert.match(rule, /^Only: withdraw.*near.*exchange.near.*customer-123/);
  assert.equal(summarizeSignedMessage(JSON.stringify({ ...message, action: "unknown" })), null);
});
