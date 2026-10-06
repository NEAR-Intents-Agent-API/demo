import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agentState,
  journeyProgress,
  workspaceSummary,
} from "../../features/agents/model/agent-state";

/**
 * An agent is created with its owner and policy and goes live with one signature. These tests
 * pin that a pending agent offers exactly that signature and nothing else, and that terminal
 * states never ask a human for anything.
 */

const agent = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "a".repeat(64),
    name: "customer-42",
    external_user_id: "user-1",
    status: "PENDING",
    deleted: false,
    archived: false,
    owner: null,
    owner_account: null,
    wallet: { near_account_id: "agent.near" },
    created_at: new Date().toISOString(),
    ...overrides,
  }) as never;

const nearOwner = { type: "near", account_id: "owner.near" };

test("a pending agent asks for one activation signature", () => {
  const state = agentState(agent());
  assert.equal(state.stage, "pending");
  assert.equal(state.next.id, "onboard");
  assert.equal(state.next.signing, true, "activation is a signature, not a refresh");
});

test("a live agent needs nothing", () => {
  const state = agentState(agent({ status: "ACTIVE", owner: nearOwner }));
  assert.equal(state.stage, "ready");
  assert.equal(state.next.id, "none");
});

test("deleted, archived and abandoned agents are terminal and offer nothing", () => {
  for (const status of ["DELETED", "ARCHIVED", "ABANDONED"]) {
    assert.equal(agentState(agent({ status })).next.id, "none", status);
  }
  assert.equal(agentState(agent({ status: "DELETED" })).stage, "archived");
  assert.equal(agentState(agent({ status: "ABANDONED" })).stage, "abandoned");
});

test("the workspace counts only agents that can still become or stay live", () => {
  const summary = workspaceSummary([
    agent(),
    agent({ status: "ACTIVE", owner: nearOwner }),
    agent({ status: "DELETED" }),
    agent({ status: "ABANDONED" }),
  ]);
  assert.equal(summary.total, 2);
  assert.equal(summary.operational, 1);
  assert.equal(summary.needsYou, 1);
});

test("the journey rail is created, then live", () => {
  assert.deepEqual(journeyProgress(agent()), { done: 1, total: 2 });
  assert.deepEqual(journeyProgress(agent({ status: "ACTIVE" })), { done: 2, total: 2 });
});
