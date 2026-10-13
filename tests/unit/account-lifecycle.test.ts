import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deleteConfirmed,
  deletionSummary,
  lifecycleActions,
  lifecyclePlan,
  needsReplan,
  type RulesReading,
  rulesReading,
  stepDescription,
} from "../../features/agents/agent-detail/lifecycle/lifecycle-state";

const now = Date.parse("2026-10-13T12:00:00Z");
const cooldowns = (unfreeze: string | null) =>
  ({ unfreeze_available_at: unfreeze, policy_change_available_at: null }) as never;
const active = { status: "ACTIVE" as const, cooldowns: cooldowns(null) };
const archived = { status: "ARCHIVED" as const, cooldowns: cooldowns(null) };
const frozen: RulesReading = { state: "in_force", frozen: true };
const unfrozen: RulesReading = { state: "in_force", frozen: false };

describe("lifecycle actions", () => {
  it("offers actions only to live accounts", () => {
    assert.deepEqual(lifecycleActions("ACTIVE"), ["archive", "delete"]);
    assert.deepEqual(lifecycleActions("ARCHIVED"), ["restore", "delete"]);
    for (const status of ["PENDING", "ABANDONED", "DELETED"] as const)
      assert.deepEqual(lifecycleActions(status), []);
  });
});

describe("stale steps", () => {
  it("re-plans when the prepared step no longer fits the account", () => {
    for (const code of [
      "intent_expired",
      "wallet_already_frozen",
      "wallet_already_unfrozen",
      "pause_before_archive",
      "unpause_before_restore",
    ])
      assert.equal(needsReplan(new Error(code)), true, code);
    assert.equal(needsReplan(new Error("lifecycle_pending")), false);
    assert.equal(needsReplan("intent_expired"), false);
  });
});

describe("lifecycle plan", () => {
  it("freezes before archiving an unfrozen account", () => {
    assert.deepEqual(lifecyclePlan("archive", active, unfrozen, now), {
      ok: true,
      steps: ["agent_freeze", "agent_archive"],
    });
  });

  it("archives a frozen account in one signature", () => {
    assert.deepEqual(lifecyclePlan("archive", active, frozen, now), {
      ok: true,
      steps: ["agent_archive"],
    });
  });

  it("unfreezes before restoring a frozen archived account", () => {
    assert.deepEqual(lifecyclePlan("restore", archived, frozen, now), {
      ok: true,
      steps: ["agent_unfreeze", "agent_restore"],
    });
    assert.deepEqual(lifecyclePlan("restore", archived, unfrozen, now), {
      ok: true,
      steps: ["agent_restore"],
    });
  });

  it("waits for the unfreeze cooldown instead of failing after a signature", () => {
    const cooling = { ...archived, cooldowns: cooldowns("2026-10-13T18:00:00Z") };
    const plan = lifecyclePlan("restore", cooling, frozen, now);
    assert.equal(plan.ok, false);
    assert.match(plan.ok ? "" : plan.reason, /cooling down until/);
    // An account that is already unfrozen never needs the throttled step.
    assert.equal(lifecyclePlan("restore", cooling, unfrozen, now).ok, true);
    const over = { ...archived, cooldowns: cooldowns("2026-10-13T11:00:00Z") };
    assert.equal(lifecyclePlan("restore", over, frozen, now).ok, true);
  });

  it("offers nothing until the rules are read", () => {
    assert.equal(lifecyclePlan("archive", active, undefined, now).ok, false);
    assert.equal(lifecyclePlan("restore", archived, undefined, now).ok, false);
  });

  it("offers archive and restore only while the rules are in force", () => {
    for (const state of ["applying", "not_applied", "none", "unreadable"] as const) {
      const rules: RulesReading = { state, frozen: false };
      for (const [action, agent] of [
        ["archive", active],
        ["restore", archived],
      ] as const) {
        const plan = lifecyclePlan(action, agent, rules, now);
        assert.equal(plan.ok, false, `${action} while ${state}`);
        assert.ok(!plan.ok && plan.reason.length > 0);
      }
      assert.equal(lifecyclePlan("delete", active, rules, now).ok, true);
    }
  });

  it("reads frozen only from an applied, confirmed revision", () => {
    const view = (status: string, synced: boolean, frozen: boolean) =>
      ({ status, provider_policy_synced: synced, policy: { frozen } }) as never;
    assert.deepEqual(rulesReading(view("APPLIED", true, true), false), {
      state: "in_force",
      frozen: true,
    });
    assert.deepEqual(rulesReading(view("APPLIED", false, true), false), {
      state: "applying",
      frozen: false,
    });
    assert.deepEqual(rulesReading(view("SIGNED", false, true), false), {
      state: "applying",
      frozen: false,
    });
    assert.equal(rulesReading(view("FAILED", false, true), false)?.state, "not_applied");
    assert.equal(rulesReading(undefined, false), undefined);
    assert.equal(rulesReading(undefined, true)?.state, "unreadable");
  });

  it("deletes without freezing or archiving first", () => {
    assert.deepEqual(lifecyclePlan("delete", active, undefined, now), {
      ok: true,
      steps: ["agent_delete"],
    });
    assert.deepEqual(lifecyclePlan("delete", archived, frozen, now), {
      ok: true,
      steps: ["agent_delete"],
    });
  });

  it("refuses actions the status does not allow", () => {
    assert.equal(lifecyclePlan("restore", active, unfrozen, now).ok, false);
    assert.equal(lifecyclePlan("archive", archived, frozen, now).ok, false);
  });

  it("numbers the steps only when there are several", () => {
    assert.match(stepDescription("agent_freeze", 0, 2), /^Step 1 of 2\./);
    assert.doesNotMatch(stepDescription("agent_archive", 0, 1), /Step/);
  });
});

const entry = (asset_id: string, symbol: string | null, decimals: number, raw: string) => ({
  asset_id,
  symbol,
  decimals,
  blockchain: null,
  price: null,
  price_updated_at: null,
  price_expires_at: null,
  balance_raw: raw,
  balance: null,
});
const preview = (over: Record<string, unknown>) =>
  ({
    near_account_id: "a.near",
    beneficiary: "owner.near",
    native_balance: "0",
    public: [],
    confidential: [],
    assets_lost: false,
    retirement: "provider_delete",
    ...over,
  }) as never;

describe("deletion summary", () => {
  it("reads public and private balances as rows", () => {
    const summary = deletionSummary(
      preview({
        public: [entry("nep141:usdc", "USDC", 6, "2500000")],
        confidential: [entry("nep141:wrap.near", "wNEAR", 24, "1000000000000000000000000")],
        assets_lost: true,
      }),
    );
    assert.deepEqual(
      summary.rows.map((row) => [row.label, row.amount, row.scope]),
      [
        ["USDC", "2.5", "public"],
        ["wNEAR", "1", "private"],
      ],
    );
    assert.equal(summary.lost, true);
  });

  it("is lossless for an empty account and still shows native NEAR", () => {
    const summary = deletionSummary(preview({ native_balance: "2500000000000000000000000" }));
    assert.equal(summary.lost, false);
    assert.equal(summary.native, "2.5");
    assert.equal(summary.beneficiary, "owner.near");
  });

  it("treats listed balances as lost even if the flag is false", () => {
    const summary = deletionSummary(
      preview({ public: [entry("nep141:usdc", null, 6, "1")], assets_lost: false }),
    );
    assert.equal(summary.lost, true);
    assert.equal(summary.rows[0]?.label, "nep141:usdc");
  });
});

describe("delete confirmation", () => {
  it("needs the exact name only when funds are lost", () => {
    assert.equal(deleteConfirmed("", "Trader", false), true);
    assert.equal(deleteConfirmed("", "Trader", true), false);
    assert.equal(deleteConfirmed("trader", "Trader", true), false);
    assert.equal(deleteConfirmed(" Trader ", "Trader", true), true);
  });
});
