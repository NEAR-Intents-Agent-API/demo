import assert from "node:assert/strict";
import { test } from "node:test";
import { changedRuleSettings } from "../../features/policy/policy-tab/rule-changes-utils";
import { defaultRules, policyFromRules, rulesProblem } from "../../features/policy/rules/rules";

test("unchanged and reverted drafts leave no pending changes", () => {
  const current = structuredClone(defaultRules);
  const draft = structuredClone(current);
  assert.deepEqual(changedRuleSettings(current, draft), []);
  draft.abilities.swap = false;
  assert.deepEqual(
    changedRuleSettings(current, draft).map(({ id }) => id),
    ["swap"],
  );
  draft.abilities.swap = current.abilities.swap;
  assert.deepEqual(changedRuleSettings(current, draft), []);
});

test("edits across dialogs accumulate into one complete policy payload", () => {
  const current = structuredClone(defaultRules);
  const draft = structuredClone(current);
  draft.abilities.swap = false;
  draft.budget.dailyUsd = "25.00";
  draft.delaySeconds = "60";
  assert.deepEqual(
    changedRuleSettings(current, draft).map(({ id }) => id),
    ["swap", "dailyUsd", "delay"],
  );
  const policy = policyFromRules(null, draft);
  assert.deepEqual(policy.actions, ["transfer", "withdraw"]);
  assert.equal(policy.budget.daily_usd, "25.00");
  assert.equal(policy.timelock_ms, 60_000);
  assert.equal(rulesProblem(draft), null);
});

test("dependent fields appear under their corresponding setting", () => {
  const current = structuredClone(defaultRules);
  const draft = structuredClone(current);
  draft.maxPerHour = "10";
  draft.limits = [{ assetId: "nep141:wrap.near", perTransaction: "5000" }];
  draft.approval = true;
  assert.deepEqual(
    changedRuleSettings(current, draft).map(({ id }) => id),
    ["limits", "approval"],
  );
});

test("destination edits allow private balances; invalid token choices still require correction", () => {
  const current = structuredClone(defaultRules);
  const draft = structuredClone(current);
  draft.destinations = {
    mode: "only",
    list: [{ action: "transfer", address: "sample.near", confidential: false }],
  };
  assert.deepEqual(
    changedRuleSettings(current, draft).map(({ id }) => id),
    ["destinations"],
  );
  assert.equal(rulesProblem(draft), null);
  draft.tokens = [];
  assert.ok(rulesProblem(draft));
  draft.tokens = "any";
  assert.equal(rulesProblem(draft), null);
});
