import type { DestinationRule } from "@near-intents-agent-api/sdk";
import {
  destinationLabel,
  destinationRuleSchema,
  destinationSchema,
} from "@/lib/agent-api/schemas";
import { formatDelayMs } from "@/lib/format/delay";

/**
 * Turns one owner-signed envelope into the facts a person needs to consent to it.
 *
 * The security property is that nothing here is invented: every row is read out of the exact
 * parsed message that the server will verify, and the raw bytes stay visible underneath. This
 * module must never invent values. Mainnet is implicit in the summary but remains in the raw bytes;
 * an unrecognised or malformed envelope returns `null` so the dialog falls back to showing
 * only the bytes.
 *
 * Domain strings come from `packages/contracts`; a change there should show up here as a
 * fallback to raw JSON rather than as a confidently wrong summary.
 */

export type SummaryRow = { label: string; value: string; mono?: boolean; emphasis?: boolean };

export type MessageSummary = {
  /** What this signature authorizes, in one line. */
  title: string;
  /** Human name for the ceremony, e.g. "binding", "policy revision". */
  kind: string;
  rows: SummaryRow[];
  /** The rules or the request itself, when the envelope carries one. */
  details: SummaryRow[];
};

const ownerAdminDomain = "near-intents-agent-api.owner-admin.v2";

type Kind = { kind: string; title: string };

const KINDS: Record<string, Kind> = {
  "near-intents-agent-api.agent-control.v4": {
    kind: "agent control",
    title: "Change the agent account's lifecycle state",
  },
  "near-intents-agent-api.agent-delete.v3": {
    kind: "agent deletion",
    title: "Delete this agent account irreversibly",
  },
  "near-intents-agent-api.agent-grant.v6": {
    kind: "agent grant",
    title: "Let one client use this agent account",
  },
};

/** One owner-admin domain carries several commands; the action picks which one is signed. */
const OWNER_ADMIN_ACTIONS: Record<string, Kind> = {
  update_policy: { kind: "policy revision", title: "Save account rules" },
  revoke_grant: {
    kind: "grant revocation",
    title: "Stop one client using this agent account",
  },
  cancel_execution: { kind: "execution cancellation", title: "Cancel one queued execution" },
};

function kindOf(envelope: Record<string, unknown>): Kind | undefined {
  if (envelope.domain === ownerAdminDomain)
    return typeof envelope.action === "string" ? OWNER_ADMIN_ACTIONS[envelope.action] : undefined;
  return typeof envelope.domain === "string" ? KINDS[envelope.domain] : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function push(
  rows: SummaryRow[],
  label: string,
  value: unknown,
  mono = false,
  emphasis = false,
): void {
  if (value === undefined || value === null || value === "") return;
  rows.push({ label, value: String(value), mono, emphasis });
}

/** Parses the signed string, returning null for anything this summary does not understand. */
export function summarizeSignedMessage(message: string): MessageSummary | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(message);
  } catch {
    return null;
  }
  const envelope = asRecord(parsed);
  if (!envelope) return null;
  const known = kindOf(envelope);
  if (!known) return null;

  const rows: SummaryRow[] = [];
  const details: SummaryRow[] = [];
  push(rows, "Domain", envelope.domain, true);
  pushOwner(rows, envelope.owner);
  if (envelope.network !== "mainnet") push(rows, "Network", envelope.network);
  push(rows, "Agent account", envelope.agent_id, true);
  push(rows, "Expires", formatExpiry(envelope.expires_at_ms));

  switch (known.kind) {
    case "policy revision":
      push(rows, "Expected revision", envelope.expected_revision);
      push(rows, "Policy hash", envelope.target_id, true);
      collectPolicy(details, envelope.policy);
      break;
    case "grant revocation":
      push(rows, "Grant", envelope.target_id, true, true);
      break;
    case "execution cancellation":
      push(rows, "Operation", envelope.target_id, true, true);
      break;
    case "agent control":
      push(rows, "Action", envelope.action, false, true);
      push(rows, "Expected revision", envelope.expected_revision);
      push(rows, "Policy hash", envelope.policy_hash, true);
      break;
    case "agent deletion":
      push(rows, "Remaining NEAR goes to", envelope.beneficiary, true, true);
      if (envelope.confirm_asset_loss === true)
        details.push({
          label: "Balances",
          value: "Public and confidential balances still in the account are destroyed",
          emphasis: true,
        });
      break;
    case "agent grant":
      push(rows, "Grant", envelope.label, false, true);
      push(rows, "Token commitment", envelope.credential, true);
      collectGrant(details);
      break;
    default:
      break;
  }

  push(rows, "Recipient", envelope.recipient, true);
  return { title: known.title, kind: known.kind, rows, details };
}

/** A grant names who may act; what it may do is the account's rules, never the grant. */
function collectGrant(details: SummaryRow[]): void {
  details.push({
    label: "What it may do",
    value: "Whatever the account's rules allow, the same for every grant",
    mono: false,
  });
}

function renderDestination(item: unknown): string {
  const parsed = destinationSchema.safeParse(item);
  if (parsed.success) return `${parsed.data.action}: ${destinationLabel(parsed.data)}`;
  return typeof item === "string" ? item : JSON.stringify(item);
}

function pushOwner(rows: SummaryRow[], owner: unknown): void {
  const typed = asRecord(owner);
  if (!typed) return;
  const type = typeof typed.type === "string" ? typed.type : "unknown";
  const identity = [typed.account_id, typed.address, typed.credential_id].find(
    (candidate): candidate is string => typeof candidate === "string",
  );
  rows.push({
    label: `Owner (${type})`,
    value: identity ?? "—",
    mono: true,
    emphasis: true,
  });
}

/** The rules a policy signature actually installs: these are the spending limits. */
function collectPolicy(details: SummaryRow[], policy: unknown): void {
  const value = asRecord(policy);
  if (!value) return;
  details.push({ label: "Frozen", value: String(value.frozen ?? "—"), emphasis: true });
  pushList(details, "Allowed actions", value.actions, false);
  details.push({
    label: "Private balance",
    value: value.confidential === true ? "allowed" : "denied",
  });
  details.push({
    label: "Owner approval",
    value: value.owner_approval === true ? "required for every move" : "not required",
  });
  if (value.assets === "any") details.push({ label: "Allowed tokens", value: "any", mono: true });
  else pushList(details, "Allowed tokens", value.assets, true);
  collectLimits(details, value.limits);
  if (typeof value.max_actions_per_hour === "number")
    details.push({ label: "Rate limit", value: `${value.max_actions_per_hour} per hour` });
  collectBudget(details, value.budget);
  if (typeof value.timelock_ms === "number")
    details.push({ label: "Execution delay", value: formatDelayMs(value.timelock_ms) });
  const rule = destinationRuleSchema.safeParse(value.destinations);
  if (rule.success)
    details.push({ label: "Where funds can go", value: describeRule(rule.data), mono: true });
}

function collectBudget(details: SummaryRow[], budget: unknown): void {
  const value = asRecord(budget);
  if (!value) return;
  for (const [key, period] of [
    ["daily_usd", "a day"],
    ["weekly_usd", "a week"],
    ["monthly_usd", "a month"],
  ] as const) {
    const usd = value[key];
    if (typeof usd === "string") details.push({ label: `USD budget ${period}`, value: `$${usd}` });
  }
}

/** The account destination rule in words: every grant follows exactly this. */
function describeRule(rule: DestinationRule): string {
  if (rule.list.length === 0)
    return rule.mode === "only" ? "Nowhere (outgoing payments blocked)" : "Anywhere";
  const prefix = rule.mode === "only" ? "Only" : "Anywhere except";
  return `${prefix}: ${rule.list.map(renderDestination).join(", ")}`;
}

function collectLimits(details: SummaryRow[], limits: unknown): void {
  const value = asRecord(limits);
  if (!value) return;
  for (const [bucket, amounts] of Object.entries(value)) {
    const rendered = renderAmounts(amounts);
    if (rendered)
      details.push({ label: `${capabilityLabel(bucket)} limit`, value: rendered, mono: true });
  }
}

/** `{ "wrap.near": "500" }` → `"500 wrap.near"`; token order is preserved, values verbatim. */
function renderAmounts(amounts: unknown): string | null {
  const value = asRecord(amounts);
  if (!value) return null;
  return (
    Object.entries(value)
      .map(([token, amount]) => `${String(amount)} ${token}`)
      .join(" · ") || null
  );
}

function pushList(details: SummaryRow[], label: string, list: unknown, mono: boolean): void {
  if (!Array.isArray(list)) return;
  details.push({ label, value: list.length > 0 ? list.join(", ") : "none", mono });
}

function capabilityLabel(name: string): string {
  return name.replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase());
}

/** Absolute local time plus a relative hint, so a short-lived envelope is obvious. */
function formatExpiry(value: unknown): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const at = new Date(value);
  const minutes = Math.round((value - Date.now()) / 60000);
  const relative =
    minutes <= 0
      ? "expired"
      : minutes < 60
        ? `in ${minutes} min`
        : `in ${Math.round(minutes / 60)} h`;
  return `${at.toLocaleString()} (${relative})`;
}
