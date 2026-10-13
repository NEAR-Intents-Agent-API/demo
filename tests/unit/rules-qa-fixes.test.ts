import assert from "node:assert/strict";
import { test } from "node:test";
import type { ApprovalView, Policy, ScheduledExecutionView } from "@near-intents-agent-api/sdk";
import { onboardingState } from "../../features/agents/agent-detail/onboarding-state";
import { parseDraft } from "../../features/agents/agent-list/hooks/create-draft";
import type { IntentStep } from "../../features/intents/api";
import { pendingChange, samePolicy } from "../../features/policy/policy-tab/pending-change";
import {
  scheduledActionLabel,
  scheduledTiming,
} from "../../features/policy/policy-tab/scheduled-label";
import { defaultRules } from "../../features/policy/rules/rules";
import {
  decidedApprovals,
  rememberApprovals,
} from "../../features/wallet/approvals/approval-history";
import {
  delayInput,
  delaySecondsFrom,
  formatDelayMs,
  MAX_DELAY_SECONDS,
} from "../../lib/format/delay";

const NOW = Date.parse("2026-10-13T12:00:00Z");

function step(
  status: string,
  options: { expiresAt?: string; previousRevision?: number; policy?: Policy | null } = {},
): IntentStep {
  return {
    generated: {
      expires_at: options.expiresAt ?? "2026-10-13T13:00:00Z",
      preview: {
        previous_revision: options.previousRevision ?? 3,
        policy: options.policy === undefined ? ({ actions: ["swap"] } as Policy) : options.policy,
      },
    },
    operation: { status },
  } as unknown as IntentStep;
}

test("delays are typed and shown in human units", () => {
  assert.deepEqual(delayInput("7200"), { amount: "2", unit: "hours" });
  assert.deepEqual(delayInput("172800"), { amount: "2", unit: "days" });
  assert.deepEqual(delayInput("90"), { amount: "1.5", unit: "minutes" });
  assert.equal(delaySecondsFrom("2", "hours"), "7200");
  assert.equal(delaySecondsFrom("", "days"), "0");
  assert.equal(delaySecondsFrom("abc", "days"), "NaN");
  assert.equal(MAX_DELAY_SECONDS, 2_592_000);
  assert.equal(formatDelayMs(0), "No delay");
  assert.equal(formatDelayMs(5 * 60_000), "5 minutes");
  assert.equal(formatDelayMs(90 * 60_000), "1 hour 30 minutes");
  assert.equal(formatDelayMs(Number.NaN), "Not a valid delay");
});

test("a pending change is signable only when it is unsigned, unexpired and on the current revision", () => {
  assert.equal(pendingChange(null, 3, NOW).kind, "none");
  assert.equal(pendingChange(step("PENDING_SIGNATURE"), 3, NOW).kind, "signable");
  assert.equal(
    pendingChange(step("PENDING_SIGNATURE", { previousRevision: 2 }), 3, NOW).kind,
    "none",
  );
  assert.equal(
    pendingChange(step("PENDING_SIGNATURE", { expiresAt: "2026-10-13T11:00:00Z" }), 3, NOW).kind,
    "none",
  );
  assert.equal(pendingChange(step("SUCCESS"), 3, NOW).kind, "none");
});

test("a signed or uncertain change is observed, never offered for signing", () => {
  assert.deepEqual(
    { ...pendingChange(step("QUEUED"), 3, NOW), step: undefined },
    { kind: "in_flight", needsReview: false, step: undefined },
  );
  const review = pendingChange(step("UNCERTAIN"), 3, NOW);
  assert.equal(review.kind === "in_flight" && review.needsReview, true);
  const needsReview = pendingChange(step("NEEDS_REVIEW"), 3, NOW);
  assert.equal(needsReview.kind === "in_flight" && needsReview.needsReview, true);
});

test("policies compare equal whatever their key order", () => {
  assert.equal(
    samePolicy({ a: 1, b: { c: 2, d: 3 } } as never, { b: { d: 3, c: 2 }, a: 1 } as never),
    true,
  );
  assert.equal(samePolicy({ a: 1 } as never, { a: 2 } as never), false);
});

test("approval history remembers new ids first and keeps only settled requests", () => {
  assert.deepEqual(rememberApprovals(["a", "b"], ["c", "a"]), ["c", "a", "b"]);
  assert.deepEqual(rememberApprovals(["a"], ["a"]), ["a"]);
  const views = [
    { status: "PENDING" },
    { status: "APPROVED" },
    undefined,
    { status: "EXPIRED" },
  ] as unknown as (ApprovalView | undefined)[];
  assert.deepEqual(
    decidedApprovals(views).map((view) => view.status),
    ["APPROVED", "EXPIRED"],
  );
});

test("scheduled executions are described in the owner's words", () => {
  assert.equal(scheduledActionLabel("intents_transfer"), "Transfer");
  assert.equal(scheduledActionLabel("withdraw"), "Withdrawal");
  assert.equal(scheduledActionLabel(null), "Money action");
  assert.equal(scheduledActionLabel("constructor"), "Money action");
  const waiting = {
    state: "waiting",
    execute_after: "2026-10-13T13:00:00Z",
  } as ScheduledExecutionView;
  assert.match(scheduledTiming(waiting, NOW), /^Runs /);
  assert.match(scheduledTiming(waiting, Date.parse("2026-10-13T14:00:00Z")), /^Due now/);
  assert.match(scheduledTiming({ ...waiting, state: "releasing" } as never, NOW), /^Running now/);
});

test("an activation request is signable only until it expires", () => {
  assert.equal(onboardingState(step("PENDING_SIGNATURE"), NOW), "sign");
  assert.equal(
    onboardingState(step("PENDING_SIGNATURE", { expiresAt: "2026-10-13T11:00:00Z" }), NOW),
    "expired",
  );
  assert.equal(onboardingState(step("FAILED"), NOW), "expired");
  assert.equal(onboardingState(step("QUEUED"), NOW), "confirming");
  assert.equal(onboardingState(step("UNCERTAIN"), NOW), "review");
  assert.equal(onboardingState(step("SUCCESS"), NOW), "done");
});

test("a stored account draft is restored only when it has the shape this build wrote", () => {
  const draft = { name: "Trader", rules: defaultRules, agentId: "agent_1" };
  assert.deepEqual(parseDraft(JSON.stringify(draft)), draft);
  assert.deepEqual(
    parseDraft(JSON.stringify({ name: "x", rules: defaultRules }))?.agentId,
    undefined,
  );
  assert.equal(parseDraft(null), null);
  assert.equal(parseDraft("{not json"), null);
  assert.equal(parseDraft(JSON.stringify({ name: 1, rules: defaultRules })), null);
  assert.equal(
    parseDraft(JSON.stringify({ name: "x", rules: { ...defaultRules, tokens: 5 } })),
    null,
  );
  assert.equal(parseDraft(JSON.stringify({ name: "x", rules: { abilities: {} } })), null);
});
