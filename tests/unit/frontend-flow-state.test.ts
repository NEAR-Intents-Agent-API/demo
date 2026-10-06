import assert from "node:assert/strict";
import { test } from "node:test";
import {
  nextSetupStep,
  type SetupStep,
  setupProgressCounts,
  setupStepStatus,
} from "../../features/agents/agent-detail/components/setup-progress-utils.js";
import {
  applyFlowBalance,
  canSwitchFundsFlow,
  effectiveFlow,
  initialFlowLane,
  isFlowVisible,
  shouldInitializeLane,
} from "../../features/funds/flows/flow-state-utils.js";

test("viewing a completed setup step keeps completion distinct from the next unfinished step", () => {
  const step: SetupStep = { id: "step", title: "Step", detail: "", cta: "Open", done: false };
  assert.equal(setupStepStatus({ ...step, done: true }, true, false), "Completed");
  assert.equal(setupStepStatus(step, true, true), "Current");
  assert.equal(setupStepStatus(step, false, true), "Next");
  assert.equal(setupStepStatus(step, false, false), "Not started");
  assert.equal(setupStepStatus({ ...step, optional: true }, false, false), "Optional");
});

// Cover context changes that could otherwise select the wrong source balance.
test("fresh funds forms inherit Holdings balance; private restrictions remain enforced", () => {
  for (const flow of ["swap", "send", "withdraw"] as const) {
    assert.equal(initialFlowLane(flow, "confidential"), "private");
    assert.equal(initialFlowLane(flow, "public"), "public");
    assert.equal(initialFlowLane(flow, "confidential", false), "public");
  }
  assert.equal(initialFlowLane("deposit", "confidential"), "private");
  assert.equal(initialFlowLane("deposit", "public"), "public");
  assert.equal(initialFlowLane("deposit", "confidential", false), "private");
});

test("Holdings balance changes clear spending inputs, keeping accepted and pending moves fixed", () => {
  const changes: string[] = [];
  const input = {
    lane: "private" as const,
    currentLane: "public" as const,
    pending: false,
    tracking: null,
    setLane: (lane: "public" | "private") => changes.push(lane),
    clearAmount: () => changes.push("amount cleared"),
    clearRecipient: () => changes.push("recipient cleared"),
  };
  assert.equal(applyFlowBalance({ ...input, pending: true }), false);
  assert.equal(applyFlowBalance({ ...input, tracking: { id: "accepted" } }), false);
  assert.equal(applyFlowBalance({ ...input, currentLane: "private" }), false);
  assert.deepEqual(changes, []);
  assert.equal(applyFlowBalance(input), true);
  assert.deepEqual(changes, ["private", "amount cleared", "recipient cleared"]);
});

test("deposit balance changes preserve the entered amount", () => {
  let lane = "public";
  assert.equal(
    applyFlowBalance({
      lane: "private",
      currentLane: "public",
      pending: false,
      tracking: null,
      setLane: (next) => {
        lane = next;
      },
    }),
    true,
  );
  assert.equal(lane, "private");
});

test("reopening never reassigns a drafted or submitted move; submission blocks action switching", () => {
  assert.equal(shouldInitializeLane("1.25", null), false);
  assert.equal(shouldInitializeLane("", { id: "operation", status: "PENDING" }), false);
  assert.equal(shouldInitializeLane("", { id: "operation", status: "NEEDS_REVIEW" }), false);
  assert.equal(shouldInitializeLane("", null), true);
  assert.equal(shouldInitializeLane("", null, true), false);
  assert.equal(canSwitchFundsFlow(true), false);
  assert.equal(canSwitchFundsFlow(false), true);
});

test("optional dashboard access cannot mask client setup or completed setup", () => {
  const steps: SetupStep[] = [
    { id: "live", title: "Activated", detail: "", cta: "", done: true },
    { id: "fund", title: "Add funds", detail: "", cta: "", done: false },
    {
      id: "access",
      title: "Allow dashboard moves",
      detail: "",
      cta: "",
      done: false,
      optional: true,
    },
    { id: "connect", title: "Connect a client", detail: "", cta: "", done: false },
  ];
  assert.equal(nextSetupStep(steps)?.id, "fund");
  assert.equal(nextSetupStep(steps, "access")?.id, "access");
  assert.equal(nextSetupStep(steps, "missing")?.id, "fund");
  const funding = steps.find((step) => step.id === "fund");
  assert.ok(funding);
  funding.done = true;
  assert.equal(nextSetupStep(steps)?.id, "connect");
  const client = steps.find((step) => step.id === "connect");
  assert.ok(client);
  client.done = true;
  assert.equal(nextSetupStep(steps), null);
  assert.equal(steps.find((step) => step.id === "access")?.done, false);
});

test("setup progress can complete while the optional dashboard permission remains off", () => {
  const steps: SetupStep[] = [
    { id: "live", title: "Activated", detail: "", cta: "", done: true },
    { id: "fund", title: "Add funds", detail: "", cta: "", done: true },
    {
      id: "access",
      title: "Allow dashboard moves",
      detail: "",
      cta: "",
      done: false,
      optional: true,
    },
    { id: "connect", title: "Connect a client", detail: "", cta: "", done: true },
  ];
  const progress = setupProgressCounts(steps);
  assert.equal(progress.completed, progress.required.length);
  assert.equal(progress.required.length, 3);
  assert.equal(progress.optional.length, 1);
  assert.equal(progress.optional[0]?.done, false);
  assert.equal(nextSetupStep(steps), null);
});

test("only Deposit is offered until more actions are enabled", () => {
  for (const flow of ["swap", "send", "withdraw", "private"] as const) {
    assert.equal(isFlowVisible(flow, false), false);
    assert.equal(isFlowVisible(flow, true), true);
    assert.equal(effectiveFlow(flow, false), "deposit");
    assert.equal(effectiveFlow(flow, true), flow);
  }
  assert.equal(isFlowVisible("deposit", false), true);
  assert.equal(effectiveFlow(null, true), "deposit");
});
