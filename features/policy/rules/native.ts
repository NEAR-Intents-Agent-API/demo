import type { NativePolicy, TypedDataDomain } from "@/lib/agent-api/schemas";

/**
 * The account's `policy.native`: the agent's own NEAR, EVM and Solana keys outside NEAR Intents.
 * The editor always holds the full block; `policyFromRules` omits it while every switch is off.
 */

/** Every native method off: what an omitted `native` block means. */
export const nativeOff: NativePolicy = {
  near: { sign_message: [], transfer: false, call: [] },
  evm: { sign_typed_data: [], sign_message: false, sign_transaction: false },
  solana: { sign_message: false, sign_transaction: false },
};

/** One sentence for the editor, the summary and the activation overview alike. */
export const NATIVE_WARNING =
  "Native methods skip destinations, budget, execution delay, schedule and owner approval. A signed EVM or Solana transaction, or typed data such as a permit, can move everything at that address.";

/** The typed message types: one per line or comma separated, trimmed and listed once each. */
export function parsePrimaryTypes(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\n,]/)
        .map((type) => type.trim())
        .filter(Boolean),
    ),
  ];
}

/** A listed EIP-712 domain as the owner reads it, with the message types it admits. */
export function domainLabel(domain: TypedDataDomain): string {
  const where = [
    domain.version === undefined ? null : `v${domain.version}`,
    domain.chain_id === undefined ? null : `chain ${domain.chain_id}`,
    domain.verifying_contract ?? null,
    domain.salt === undefined ? null : `salt ${domain.salt}`,
  ].filter((part) => part !== null);
  const name = domain.name ?? "Unnamed domain";
  const types = domain.primary_types
    ? `only ${domain.primary_types.join(", ")}`
    : "any message type";
  return `${where.length ? `${name} (${where.join(", ")})` : name}: ${types}`;
}

/**
 * What the native block switches on, one plain entry per method (one per domain for typed data);
 * empty when all is off.
 */
export function describeNative(native: NativePolicy): string[] {
  return [
    native.near.sign_message.length
      ? `NEAR sign-in to ${native.near.sign_message.join(", ")}`
      : null,
    native.near.transfer ? "Send NEAR to any account" : null,
    native.near.call.length ? `NEAR calls to ${native.near.call.join(", ")}` : null,
    ...native.evm.sign_typed_data.map((domain) => `EVM typed data for ${domainLabel(domain)}`),
    native.evm.sign_message ? "EVM messages" : null,
    native.evm.sign_transaction ? "EVM transactions" : null,
    native.solana.sign_message ? "Solana messages" : null,
    native.solana.sign_transaction ? "Solana transactions" : null,
  ].filter((entry) => entry !== null);
}

export const nativeEnabled = (native: NativePolicy) => describeNative(native).length > 0;
