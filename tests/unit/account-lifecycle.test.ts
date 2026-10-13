import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deleteConfirmed,
  deletionSummary,
  lifecycleActions,
  lifecyclePlan,
  stepDescription,
} from "../../features/agents/agent-detail/lifecycle/lifecycle-state";

const now = Date.parse("2026-10-13T12:00:00Z");
const cooldowns = (unfreeze: string | null) =>
  ({ unfreeze_available_at: unfreeze, policy_change_available_at: null }) as never;
const active = { status: "ACTIVE" as const, cooldowns: cooldowns(null) };
const archived = { status: "ARCHIVED" as const, cooldowns: cooldowns(null) };

describe("lifecycle actions", () => {
  it("offers actions only to live accounts", () => {
    assert.deepEqual(lifecycleActions("ACTIVE"), ["archive", "delete"]);
    assert.deepEqual(lifecycleActions("ARCHIVED"), ["restore", "delete"]);
    for (const status of ["PENDING", "ABANDONED", "DELETED"] as const)
      assert.deepEqual(lifecycleActions(status), []);
  });
});

describe("lifecycle plan", () => {
  it("freezes before archiving an unfrozen account", () => {
    assert.deepEqual(lifecyclePlan("archive", active, false, now), {
      ok: true,
      steps: ["agent_freeze", "agent_archive"],
    });
  });

  it("archives a frozen account in one signature", () => {
    assert.deepEqual(lifecyclePlan("archive", active, true, now), {
      ok: true,
      steps: ["agent_archive"],
    });
  });

  it("unfreezes before restoring a frozen archived account", () => {
    assert.deepEqual(lifecyclePlan("restore", archived, true, now), {
      ok: true,
      steps: ["agent_unfreeze", "agent_restore"],
    });
    assert.deepEqual(lifecyclePlan("restore", archived, false, now), {
      ok: true,
      steps: ["agent_restore"],
    });
  });

  it("waits for the unfreeze cooldown instead of failing after a signature", () => {
    const cooling = { ...archived, cooldowns: cooldowns("2026-10-13T18:00:00Z") };
    const plan = lifecyclePlan("restore", cooling, true, now);
    assert.equal(plan.ok, false);
    assert.match(plan.ok ? "" : plan.reason, /cooling down until/);
    // An account that is already unfrozen never needs the throttled step.
    assert.equal(lifecyclePlan("restore", cooling, false, now).ok, true);
    const over = { ...archived, cooldowns: cooldowns("2026-10-13T11:00:00Z") };
    assert.equal(lifecyclePlan("restore", over, true, now).ok, true);
  });

  it("offers nothing until the rules are read", () => {
    assert.equal(lifecyclePlan("archive", active, undefined, now).ok, false);
    assert.equal(lifecyclePlan("restore", archived, undefined, now).ok, false);
  });

  it("deletes without freezing or archiving first", () => {
    assert.deepEqual(lifecyclePlan("delete", active, undefined, now), {
      ok: true,
      steps: ["agent_delete"],
    });
    assert.deepEqual(lifecyclePlan("delete", archived, true, now), {
      ok: true,
      steps: ["agent_delete"],
    });
  });

  it("refuses actions the status does not allow", () => {
    assert.equal(lifecyclePlan("restore", active, false, now).ok, false);
    assert.equal(lifecyclePlan("archive", archived, true, now).ok, false);
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
