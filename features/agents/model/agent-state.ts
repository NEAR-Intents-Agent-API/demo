import type { AgentView } from "@near-intents-agent-api/sdk";

/**
 * The demo's one piece of derived UI state: where this agent is in its life, and what — if
 * anything — a human still has to do.
 *
 * An agent is created together with its owner and first policy, and becomes live with one owner
 * signature. So there is at most one thing to do: sign that request, or wait for it to land.
 * The list, the detail header and the empty states all render from this.
 *
 * Pure and dependency-free so a unit test can pin it.
 */

export type AgentJourneyStage = "pending" | "ready" | "archived" | "abandoned";

export type AgentNextAction = {
  /** Stable id for tests and for keying. */
  id: "onboard" | "none";
  /** Imperative, second person: what the human does, not what the system does. */
  label: string;
  /** Why it matters, in one sentence. */
  detail: string;
  /** True when this action is a signature the owner must produce. */
  signing: boolean;
};

export type AgentState = {
  stage: AgentJourneyStage;
  /** Short human phrase for the badge, e.g. "Needs your signature". */
  label: string;
  /** Detail line for the agent row. */
  detail: string;
  next: AgentNextAction;
};

const nothing: AgentNextAction = { id: "none", label: "Nothing to do", detail: "", signing: false };

export function agentState(agent: AgentView): AgentState {
  switch (agent.status) {
    case "DELETED":
      return {
        stage: "archived",
        label: "Deleted",
        detail: "Removed at the provider. Its history is kept but it accepts no requests.",
        next: nothing,
      };
    case "ARCHIVED":
      return {
        stage: "archived",
        label: "Archived",
        detail: "Read-only. It cannot execute.",
        next: nothing,
      };
    case "ABANDONED":
      return {
        stage: "abandoned",
        label: "Not activated",
        detail: "Its activation request expired or failed, so it never went live.",
        next: nothing,
      };
    case "PENDING":
      return {
        stage: "pending",
        label: "Needs your signature",
        detail: "One signature binds you as owner and installs its policy.",
        next: {
          id: "onboard",
          label: "Sign to activate",
          detail:
            "You sign the exact policy transaction with your wallet or passkey. That one signature makes the agent account yours.",
          signing: true,
        },
      };
    case "ACTIVE":
      return {
        stage: "ready",
        label: "Operational",
        detail: "Owner-bound, custody wallet provisioned and policy live.",
        next: nothing,
      };
  }
}

/** Created, then live: the list's two-step progress rail. */
export function journeyProgress(agent: AgentView): { done: number; total: number } {
  const total = 2;
  return { done: agent.status === "PENDING" || agent.status === "ABANDONED" ? 1 : total, total };
}

/** One-line summary of the workspace, used by the agents page header. */
export function workspaceSummary(agents: AgentView[]): {
  total: number;
  operational: number;
  needsYou: number;
} {
  const live = agents.filter((agent) => agent.status !== "DELETED" && agent.status !== "ABANDONED");
  return {
    total: live.length,
    operational: live.filter((agent) => agent.status === "ACTIVE").length,
    needsYou: live.filter((agent) => agent.status === "PENDING").length,
  };
}
