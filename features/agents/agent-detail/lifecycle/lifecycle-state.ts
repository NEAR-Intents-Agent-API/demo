import type {
  AgentView,
  DeletionPreview,
  IntentType,
  PolicyView,
} from "@near-intents-agent-api/sdk";
import { formatDisplay } from "@/lib/format/amount";
import { accountTimestamp } from "@/lib/format/date";
import { type RulesState, rulesState } from "@/lib/policy/rules-state";

/**
 * What the owner can do to the account's life: archive it (read-only, funds stay), restore it,
 * or delete it for good. The API fixes the order: an account is frozen before it is archived
 * and unfrozen before it is restored, so each action is a short list of signed steps rather than
 * a button that fails with `pause_before_archive`.
 *
 * Pure so a unit test can pin the gates.
 */

export type LifecycleAction = "archive" | "restore" | "delete";
export type LifecycleStep = Extract<
  IntentType,
  "agent_freeze" | "agent_unfreeze" | "agent_archive" | "agent_restore" | "agent_delete"
>;

export type LifecyclePlan = { ok: true; steps: LifecycleStep[] } | { ok: false; reason: string };

type Subject = Pick<AgentView, "status" | "cooldowns">;

/** Actions that make sense for the account's current status; anything else shows no menu. */
export function lifecycleActions(status: AgentView["status"]): LifecycleAction[] {
  if (status === "ACTIVE") return ["archive", "delete"];
  if (status === "ARCHIVED") return ["restore", "delete"];
  return [];
}

/** The account's rules as far as archiving and restoring care: are they in force, and frozen. */
export type RulesReading = { state: RulesState | "unreadable"; frozen: boolean };

/** `undefined` while the rules are still being read; `failed` when the read gave up. */
export function rulesReading(
  view: PolicyView | undefined,
  failed: boolean,
): RulesReading | undefined {
  if (!view) return failed ? { state: "unreadable", frozen: false } : undefined;
  const state = rulesState(view);
  // Only the applied revision says whether the account is frozen right now.
  return { state, frozen: state === "in_force" && Boolean(view.policy?.frozen) };
}

const RULES_BLOCKED: Record<Exclude<RulesReading["state"], "in_force">, string> = {
  unreadable: "The account's rules could not be read. Reload the page to try again.",
  applying: "Its rules are still being applied. Try again in a moment.",
  not_applied: "The last rules change failed. Save the rules again before this.",
  none: "The account has no rules in force yet.",
};

/**
 * The signatures an action needs right now. `rules` is the account's current rule state, or
 * undefined while it is still being read. The API only freezes, archives or restores an account
 * whose latest rules are applied and confirmed, and the steps differ by whether it is frozen, so
 * nothing is offered before both are known.
 */
export function lifecyclePlan(
  action: LifecycleAction,
  agent: Subject,
  rules: RulesReading | undefined,
  now: number,
): LifecyclePlan {
  if (!lifecycleActions(agent.status).includes(action))
    return { ok: false, reason: "This account is not in a state that allows it." };
  if (action === "delete") return { ok: true, steps: ["agent_delete"] };
  if (rules === undefined)
    return { ok: false, reason: "Reading the account's rules to see whether it is frozen." };
  if (rules.state !== "in_force") return { ok: false, reason: RULES_BLOCKED[rules.state] };
  const { frozen } = rules;
  if (action === "archive")
    return { ok: true, steps: frozen ? ["agent_archive"] : ["agent_freeze", "agent_archive"] };
  if (!frozen) return { ok: true, steps: ["agent_restore"] };
  const available = agent.cooldowns.unfreeze_available_at;
  if (available && Date.parse(available) > now)
    return {
      ok: false,
      reason: `Unfreezing is cooling down until ${accountTimestamp(available)}. Restore needs the account unfrozen first.`,
    };
  return { ok: true, steps: ["agent_unfreeze", "agent_restore"] };
}

/**
 * Failures that mean the prepared step no longer fits the account: the request lapsed, or the
 * account is no longer in the state the plan was made for. Signing it again can never work; the
 * run re-plans from the account's current state instead.
 */
const REPLAN_CODES = new Set([
  "intent_expired",
  "wallet_already_frozen",
  "wallet_already_unfrozen",
  "pause_before_archive",
  "unpause_before_restore",
]);

export const needsReplan = (cause: unknown) =>
  cause instanceof Error && REPLAN_CODES.has(cause.message);

export const STEP_TITLE: Record<LifecycleStep, string> = {
  agent_freeze: "Freeze the account",
  agent_unfreeze: "Unfreeze the account",
  agent_archive: "Archive the account",
  agent_restore: "Restore the account",
  agent_delete: "Delete the account",
};

export const STEP_CONFIRM: Record<LifecycleStep, string> = {
  agent_freeze: "Sign to freeze",
  agent_unfreeze: "Sign to unfreeze",
  agent_archive: "Sign to archive",
  agent_restore: "Sign to restore",
  agent_delete: "Sign to delete permanently",
};

const STEP_REASON: Partial<Record<LifecycleStep, string>> = {
  agent_freeze:
    "Archiving needs the account frozen first, so nothing can run while it is archived.",
  agent_unfreeze: "Restoring needs the account unfrozen first.",
  agent_archive: "The account becomes read-only. Funds stay in it and you can restore it later.",
  agent_restore: "The account can execute again under its existing rules.",
};

/** Dialog copy for one signature in a plan, with its position when the plan has more than one. */
export function stepDescription(step: LifecycleStep, index: number, total: number): string {
  const position = total > 1 ? `Step ${index + 1} of ${total}. ` : "";
  return `${position}${STEP_REASON[step] ?? ""}`.trim();
}

export type DeletionRow = {
  key: string;
  label: string;
  amount: string;
  scope: "public" | "private";
};
export type DeletionSummary = {
  beneficiary: string;
  /** NEAR the custody account holds; it is sent to the beneficiary, not destroyed. */
  native: string | null;
  rows: DeletionRow[];
  /** True while the account holds public or private balances; deletion is refused until they are moved out. */
  holdsFunds: boolean;
};

function rowsOf(entries: DeletionPreview["public"], scope: DeletionRow["scope"]): DeletionRow[] {
  return entries.map((entry) => ({
    key: `${scope}:${entry.asset_id}`,
    label: entry.symbol ?? entry.asset_id,
    amount: formatDisplay(entry.balance_raw, entry.decimals),
    scope,
  }));
}

/** The deletion preview as rows to read. The API's `assets_lost` is authoritative; rows can only add. */
export function deletionSummary(preview: DeletionPreview): DeletionSummary {
  const rows = [...rowsOf(preview.public, "public"), ...rowsOf(preview.confidential, "private")];
  const native = BigInt(preview.native_balance) > 0n ? preview.native_balance : null;
  return {
    beneficiary: preview.beneficiary,
    native: native ? formatDisplay(native, 24) : null,
    rows,
    holdsFunds: preview.assets_lost || rows.length > 0,
  };
}
