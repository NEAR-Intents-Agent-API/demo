import {
  type NativePolicy,
  type SignIntentRules,
  signIntentDefaultSlippageBps,
  type TypedDataDomain,
} from "@/lib/agent-api/schemas";

/**
 * The account's `policy.native`: the agent's own NEAR, EVM and Solana keys outside NEAR Intents.
 * The editor always holds the full block; `policyFromRules` omits it while every switch is off.
 */

/**
 * Every native method off: what an omitted `native` block means. Solana's `sign_in`,
 * `sign_intent` and `sign_transfer`, and EVM's `sign_intent`, are left out when off.
 */
export const nativeOff: NativePolicy = {
  near: { sign_message: [], transfer: false, call: [] },
  evm: { sign_typed_data: [], sign_message: false, sign_transaction: false },
  solana: { sign_message: false, sign_transaction: false },
};

/** One sentence for the editor, the summary and the activation overview alike. */
export const NATIVE_WARNING =
  "Native methods are for advanced users and are not protected by most of this account's policy: budget, timelock, schedule and owner approval don't apply. A NEAR transfer goes only to the NEAR accounts your destinations allow, but a NEAR call can move anything the listed contract holds for the agent, and a signed EVM or Solana transaction, or EVM typed data such as a permit, can move everything at that address. A signed NEAR Intents payload pays its listed receivers, with no amount limit, and can be published by anyone who holds it until its deadline, up to 96 hours for a 1Click deposit, even after a freeze. Only switch on what the agent needs, for services you trust; a service may treat a signed message as you logging in.";

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

/** Without `key`, so an off method reads back exactly as an omitted one. */
export function without<T extends object>(value: T, key: keyof T): T {
  const { [key]: _removed, ...rest } = value;
  return rest as T;
}

/** A chain and address the way an owner reads them, for example "base 0x1234...". */
export const withdrawalLabel = (entry: { chain: string; address: string }) =>
  `${entry.chain} ${entry.address}`;

/** What one key's `sign_intent` rules let it sign, in one plain line. */
export function describeSignIntent(rules: SignIntentRules): string {
  const slippage = rules.max_slippage_bps ?? signIntentDefaultSlippageBps;
  return [
    rules.receivers.length ? `pay ${rules.receivers.join(", ")}` : "pay no listed account",
    rules.one_click_deposits ? "fund 1Click deposits that pay the agent or a receiver" : null,
    rules.withdrawals?.length
      ? `fund 1Click withdrawals to ${rules.withdrawals.map(withdrawalLabel).join(", ")}`
      : null,
    `slippage and fee up to ${slippage} bps`,
  ]
    .filter((part) => part !== null)
    .join("; ");
}

/**
 * What the native block switches on, one plain entry per method (one per domain for typed data);
 * empty when all is off.
 */
export function describeNative(native: NativePolicy): string[] {
  return [
    native.near.sign_message.length
      ? `NEAR message signing for ${native.near.sign_message.join(", ")}`
      : null,
    native.near.transfer ? "Send NEAR to allowed destinations" : null,
    native.near.call.length ? `NEAR calls to ${native.near.call.join(", ")}` : null,
    ...native.evm.sign_typed_data.map((domain) => `EVM typed data for ${domainLabel(domain)}`),
    native.evm.sign_message ? "EVM messages" : null,
    native.evm.sign_intent
      ? `EVM NEAR Intents payloads (${describeSignIntent(native.evm.sign_intent)})`
      : null,
    native.evm.sign_transaction ? "EVM transactions" : null,
    native.solana.sign_in?.length ? `Solana sign-in for ${native.solana.sign_in.join(", ")}` : null,
    native.solana.sign_message ? "Solana messages" : null,
    native.solana.sign_intent
      ? `Solana NEAR Intents payloads (${describeSignIntent(native.solana.sign_intent)})`
      : null,
    native.solana.sign_transfer ? "Solana transfers to allowed destinations" : null,
    native.solana.sign_transaction ? "Solana transactions" : null,
  ].filter((entry) => entry !== null);
}

export const nativeEnabled = (native: NativePolicy) => describeNative(native).length > 0;
