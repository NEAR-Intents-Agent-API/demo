import type { FlowId } from "./flow-options";

export function initialFlowLane(
  flow: FlowId,
  portfolioLane: "public" | "confidential",
  privateAllowed = true,
) {
  return portfolioLane === "public" || (flow !== "deposit" && !privateAllowed)
    ? "public"
    : "private";
}

/** Reopening must never silently change a drafted or submitted move. */
export function shouldInitializeLane(amount: string, tracking: unknown, hasSelection = false) {
  return amount.trim() === "" && !tracking && !hasSelection;
}

/** Deposit needs no grant and is always offered; the spending flows sit behind "More actions". */
export function isFlowVisible(flow: FlowId, moreActions: boolean) {
  return moreActions || flow === "deposit";
}

export function effectiveFlow(flow: FlowId | null, moreActions: boolean): FlowId {
  return flow && isFlowVisible(flow, moreActions) ? flow : "deposit";
}

export function canSwitchFundsFlow(pending: boolean) {
  return !pending;
}

export function portfolioLaneOf(lane: "public" | "private") {
  return lane === "private" ? "confidential" : "public";
}

/** Match the existing explicit balance-change behavior; accepted operations stay immutable. */
export function applyFlowBalance(input: {
  lane: "public" | "private";
  currentLane: "public" | "private";
  pending: boolean;
  tracking: unknown;
  setLane: (lane: "public" | "private") => void;
  clearAmount?: () => void;
  clearRecipient?: () => void;
}) {
  if (input.pending || input.tracking || input.lane === input.currentLane) return false;
  input.setLane(input.lane);
  input.clearAmount?.();
  input.clearRecipient?.();
  return true;
}
