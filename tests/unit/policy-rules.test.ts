import assert from "node:assert/strict";
import { test } from "node:test";
import { policySchema } from "@/lib/agent-api/schemas";
import {
  defaultRules,
  policyFromRules,
  type Rules,
  rulesFromPolicy,
  rulesProblem,
} from "../../features/policy/rules/rules";

const NEAR_ASSET = "nep141:wrap.near";
const USDC = "nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
const rules = (patch: Partial<Rules> = {}): Rules => ({
  ...structuredClone(defaultRules),
  ...patch,
});

test("a new agent can do everything NEAR Intents offers and sends nowhere yet", () => {
  const policy = policySchema.parse(policyFromRules(null, rules()));
  assert.deepEqual(policy, {
    frozen: false,
    actions: ["swap", "transfer", "withdraw"],
    confidential: true,
    owner_approval: false,
    assets: "any",
    limits: {},
    max_actions_per_hour: null,
    destinations: { mode: "only", list: [] },
    budget: { daily_usd: null, weekly_usd: null, monthly_usd: null },
    timelock_ms: 0,
  });
  assert.deepEqual(rulesFromPolicy(policy), defaultRules);
});

test("each ability maps to one policy switch", () => {
  const off = rules({
    abilities: { swap: false, transfer: false, withdraw: false, confidential: false },
  });
  const policy = policyFromRules(null, off);
  assert.deepEqual(policy.actions, []);
  assert.equal(policy.confidential, false);
  assert.deepEqual(rulesFromPolicy(policy).abilities, off.abilities);

  const swapOnly = policyFromRules(
    null,
    rules({ abilities: { ...off.abilities, swap: true, confidential: true } }),
  );
  assert.deepEqual(swapOnly.actions, ["swap"]);
  assert.equal(swapOnly.confidential, true);
});

test("tokens and per-move caps are the policy's assets and limits, with no provider aliases", () => {
  const listed = rules({
    tokens: [NEAR_ASSET, USDC],
    limits: [
      { assetId: NEAR_ASSET, perTransaction: "5000" },
      { assetId: USDC, perTransaction: "10000000" },
    ],
  });
  const policy = policyFromRules(null, listed);
  assert.deepEqual(policy.assets, [NEAR_ASSET, USDC]);
  assert.deepEqual(policy.limits, {
    per_transaction: { [NEAR_ASSET]: "5000", [USDC]: "10000000" },
  });
  const back = rulesFromPolicy(policy);
  assert.deepEqual(back.tokens, [NEAR_ASSET, USDC]);
  assert.deepEqual(back.limits, listed.limits);
});

test("editing caps keeps the buckets the editor does not show; no cap drops the key", () => {
  const current = policyFromRules(null, rules());
  current.limits = { per_transaction: { [USDC]: "1" }, daily: { [NEAR_ASSET]: "1000" } };
  const next = policyFromRules(current, { ...rulesFromPolicy(current), limits: [] });
  assert.deepEqual(next.limits, { daily: { [NEAR_ASSET]: "1000" } });
});

test("hourly cap, budget and approval map straight onto the policy", () => {
  const policy = policyFromRules(
    null,
    rules({
      maxPerHour: "12",
      approval: true,
      budget: { dailyUsd: "25.00", weeklyUsd: "", monthlyUsd: " 300 " },
    }),
  );
  assert.equal(policy.max_actions_per_hour, 12);
  assert.equal(policy.owner_approval, true);
  assert.deepEqual(policy.budget, { daily_usd: "25.00", weekly_usd: null, monthly_usd: "300" });
  const back = rulesFromPolicy(policy);
  assert.equal(back.maxPerHour, "12");
  assert.equal(back.approval, true);
  assert.deepEqual(back.budget, { dailyUsd: "25.00", weeklyUsd: "", monthlyUsd: "300" });
});

test("the delay is typed in seconds and stored in exact milliseconds", () => {
  assert.equal(policyFromRules(null, rules({ delaySeconds: "60" })).timelock_ms, 60_000);
  assert.equal(policyFromRules(null, rules({ delaySeconds: "0.25" })).timelock_ms, 250);
  assert.equal(
    policyFromRules(null, rules({ delaySeconds: "2592000" })).timelock_ms,
    2_592_000_000,
  );
  assert.equal(
    rulesFromPolicy({ ...policyFromRules(null, rules()), timelock_ms: 90_000 }).delaySeconds,
    "90",
  );
  assert.equal(
    rulesFromPolicy({ ...policyFromRules(null, rules()), timelock_ms: 1_500 }).delaySeconds,
    "1.5",
  );
  assert.equal(rulesProblem(rules({ delaySeconds: "2592000" })), null);
  assert.match(rulesProblem(rules({ delaySeconds: "2592001" })) ?? "", /delay/);
  assert.match(rulesProblem(rules({ delaySeconds: "-1" })) ?? "", /delay/);
});

test("destinations are the account's one rule, in the API's own shape", () => {
  assert.deepEqual(
    defaultRules.destinations,
    { mode: "only", list: [] },
    "new accounts send nowhere",
  );
  const only = rules({
    destinations: {
      mode: "only",
      list: [
        { action: "transfer", address: "alice.near", confidential: false },
        { action: "withdraw", chain: "eth", address: `0x${"a".repeat(40)}`, memo: null },
      ],
    },
  });
  const policy = policyFromRules(null, only);
  assert.deepEqual(policy.destinations, only.destinations);
  assert.deepEqual(rulesFromPolicy(policy).destinations, only.destinations);
  policySchema.parse(policy);
  // The private balance works with any destination rule: shield/unshield name no destination.
  assert.equal(rulesProblem(only), null);
  assert.equal(rulesProblem(rules()), null, "an empty list is a valid rule");
  assert.match(
    rulesProblem(rules({ limits: [{ assetId: USDC, perTransaction: "" }] })) ?? "",
    /capped token/,
  );
  assert.match(rulesProblem(rules({ tokens: [] })) ?? "", /token/);
});
