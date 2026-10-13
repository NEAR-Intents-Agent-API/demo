import { defaultRules, type Rules } from "@/features/policy/model";

const KEY = "near-intents-agent:create-draft";

/** The half-finished account setup: what was typed, and the request already prepared for it. */
export type CreateDraft = { name: string; rules: Rules; agentId?: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Only a draft this build wrote is trusted; anything else is dropped rather than repaired. */
export function parseDraft(raw: string | null): CreateDraft | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || typeof value.name !== "string" || !isRecord(value.rules)) return null;
    const rules = value.rules;
    const shape = defaultRules as unknown as Record<string, unknown>;
    for (const key of Object.keys(shape)) if (typeof rules[key] !== typeof shape[key]) return null;
    if (rules.tokens !== "any" && !Array.isArray(rules.tokens)) return null;
    if (!Array.isArray(rules.limits)) return null;
    return {
      name: value.name,
      rules: rules as unknown as Rules,
      agentId: typeof value.agentId === "string" ? value.agentId : undefined,
    };
  } catch {
    return null;
  }
}

export function readDraft(): CreateDraft | null {
  try {
    return parseDraft(window.sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function writeDraft(draft: CreateDraft) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Private windows and blocked storage just lose the convenience.
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}
