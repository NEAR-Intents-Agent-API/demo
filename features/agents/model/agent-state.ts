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

export type AgentJourneyStage =
  | "pending"
  | "ready"
  | "active"
  | "frozen"
  | "archived"
  | "abandoned";

/**
 * What the state is derived from: the API view, plus the owner's freeze from the applied rules.
 * `null` is unknown (not read yet, or the read failed): shown as just "Active", never as
 * operational or frozen.
 */
export type AgentStateInput = AgentView & { frozen: boolean | null };

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

export function agentState(agent: AgentStateInput): AgentState {
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
      if (agent.frozen === null)
        return {
          stage: "active",
          label: "Active",
          detail: "Owner-bound and live. Whether its rules freeze it is not known right now.",
          next: nothing,
        };
      if (agent.frozen)
        return {
          stage: "frozen",
          label: "Frozen",
          detail: "The owner froze it. Every money action is refused until it is unfrozen.",
          next: nothing,
        };
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

/**
 * The accounts the workspace lists: everything except deleted ones (gone for good) and ones
 * whose activation expired (never live). Archived accounts stay, shown as archived.
 */
export function visibleAgents<T extends AgentView>(agents: T[]): T[] {
  return agents.filter((agent) => agent.status !== "DELETED" && agent.status !== "ABANDONED");
}

/** Counters over the listed accounts; `total` is exactly the number of rows. */
export function workspaceSummary(agents: AgentStateInput[]): {
  total: number;
  operational: number;
  frozen: number;
  /** Live accounts whose frozen state is not known; they are in neither count above. */
  unknown: number;
  needsYou: number;
} {
  const listed = visibleAgents(agents);
  const active = listed.filter((agent) => agent.status === "ACTIVE");
  return {
    total: listed.length,
    operational: active.filter((agent) => agent.frozen === false).length,
    frozen: active.filter((agent) => agent.frozen === true).length,
    unknown: active.filter((agent) => agent.frozen === null).length,
    needsYou: listed.filter((agent) => agent.status === "PENDING").length,
  };
}
