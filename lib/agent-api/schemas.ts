import type {
  Destination,
  DestinationRule,
  GenerateIntentRequest,
  GenerateIntentResponse,
  IntentType,
  OwnerWallet,
  Policy,
  Schedule,
  SignedData,
  Status,
} from "@near-intents-agent-api/sdk";
import { z } from "zod";
import {
  evmChains,
  intentsAccount,
  transferRecipientProblem,
  withdrawalAddressProblem,
} from "./address";

/**
 * Runtime validation for the Agent API payloads this app handles. The SDK ships plain types and
 * no schemas, so these mirror the wire shapes the app depends on. The rulebook, destinations and
 * owner wallet are checked exactly, because the rules editor builds them. Wallet-produced
 * payloads and intent requests are shape-checked and passed through; the API verifies them in
 * full. The assertions below fail the build when an exact schema drifts from the SDK's types.
 */

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
function assertType<_T extends true>() {}

const hex64 = z.string().regex(/^[0-9a-f]{64}$/);
const base64url = z.string().regex(/^[A-Za-z0-9_-]+$/);
const nearAccount = z.string().min(2).max(64);

export const ownerWalletSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("near"),
    account_id: nearAccount,
    public_key: z.string().regex(/^ed25519:[1-9A-HJ-NP-Za-km-z]{32,44}$/),
  }),
  z.strictObject({
    type: z.literal("evm"),
    address: z.string().regex(/^0x[0-9a-f]{40}$/),
    chain_id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    public_key: z.string().regex(/^0x[0-9a-f]{128}$/),
  }),
  z.strictObject({
    type: z.literal("passkey"),
    credential_id: base64url,
    public_key: base64url,
    rp_id: z.string().min(1).max(253),
    origin: z.string().url(),
  }),
]);
assertType<Equal<z.infer<typeof ownerWalletSchema>, OwnerWallet>>();

// ---- Destinations

const chainAliases: Record<string, string> = {
  ethereum: "eth",
  arbitrum: "arb",
  polygon: "pol",
  matic: "pol",
  optimism: "op",
  avalanche: "avax",
  solana: "sol",
  bitcoin: "btc",
  zcash: "zec",
  dogecoin: "doge",
  litecoin: "ltc",
  bitcoincash: "bch",
  berachain: "bera",
};
export const canonicalChain = (chain: string) => chainAliases[chain] ?? chain;

/**
 * One place funds may go, named exactly. No wildcards. This checks only what the API checks, so
 * every destination it already holds (added through the SDK or another client) still round-trips
 * through a whole policy; per-network address formats are checked by `typedDestinationSchema`,
 * only on the entry an owner is adding.
 */
const destinationUnion = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("withdraw"),
    chain: z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/),
    address: z
      .string()
      .min(1)
      .max(256)
      .refine((value) => value === value.trim(), "Address whitespace is not allowed"),
    memo: z.string().max(256).nullable(),
  }),
  z.strictObject({
    action: z.literal("transfer"),
    address: nearAccount,
    confidential: z.boolean(),
  }),
]);

type DestinationCtx = Parameters<Parameters<typeof destinationUnion.superRefine>[0]>[1];

/** What the API itself enforces on every destination. */
function checkApiRules(value: Destination, ctx: DestinationCtx) {
  if (value.action !== "withdraw") return;
  if (canonicalChain(value.chain) !== value.chain)
    ctx.addIssue({ code: "custom", message: "Use the canonical chain identifier" });
  if (evmChains.has(value.chain) && !/^0x[0-9a-f]{40}$/.test(value.address))
    ctx.addIssue({
      code: "custom",
      message: "EVM destinations must use canonical lowercase hex addresses",
      path: ["address"],
    });
}

export const destinationSchema = destinationUnion.superRefine(checkApiRules);
assertType<Equal<z.infer<typeof destinationSchema>, Destination>>();

/** A destination the owner is typing: the API's checks plus the address format of its network. */
const typedDestinationSchema = destinationUnion.superRefine((value, ctx) => {
  const problem =
    value.action === "transfer"
      ? transferRecipientProblem(value.address)
      : withdrawalAddressProblem(value.chain, value.address);
  if (problem) ctx.addIssue({ code: "custom", message: problem, path: ["address"] });
  checkApiRules(value, ctx);
});

/**
 * Exact identity for a destination the owner typed: canonical chain id, lowercase EVM hex; a memo
 * is never altered. Throws a `ZodError` naming the first problem, malformed addresses included.
 */
export function canonicalDestination(input: Destination): Destination {
  if (input.action === "transfer")
    return typedDestinationSchema.parse({ ...input, address: intentsAccount(input.address) });
  const chain = canonicalChain(input.chain);
  const address = evmChains.has(chain) ? input.address.toLowerCase() : input.address;
  return typedDestinationSchema.parse({ ...input, chain, address });
}

export function destinationLabel(value: Destination): string {
  if (value.action === "transfer")
    return `transfer: ${value.confidential ? "confidential" : "intents"} account ${value.address}`;
  return `withdraw: ${value.chain} ${value.address}${value.memo === null ? " (no memo)" : ` (memo: ${JSON.stringify(value.memo)})`}`;
}

export const destinationRuleSchema = z
  .strictObject({
    mode: z.enum(["any", "only", "except"]),
    list: z.array(destinationSchema).max(256),
  })
  .refine((rule) => rule.mode !== "any" || rule.list.length === 0, {
    message: "An `any` rule has no list",
  });
assertType<Equal<z.infer<typeof destinationRuleSchema>, DestinationRule>>();

const clock = /^([01]\d|2[0-3]):[0-5]\d$/;

const knownTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

/** Weekly windows on the owner's clock when money actions may run (`only`) or pause (`except`). */
export const scheduleSchema = z.strictObject({
  mode: z.enum(["only", "except"]),
  time_zone: z.string().min(1).max(64).refine(knownTimeZone, "Unknown time zone"),
  windows: z
    .array(
      z
        .strictObject({
          days: z
            .array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))
            .min(1)
            .max(7)
            .refine((days) => new Set(days).size === days.length, "Days must be unique"),
          start: z.string().regex(clock),
          end: z.string().regex(clock).or(z.literal("24:00")),
        })
        .refine((window) => window.start !== window.end, "A window cannot start where it ends"),
    )
    .min(1)
    .max(28),
});
assertType<Equal<z.infer<typeof scheduleSchema>, Schedule>>();

/** What the dashboard assumes before a policy is applied: nothing may leave the account. */
export const defaultDestinationRule: DestinationRule = { mode: "only", list: [] };

// ---- Policy

export const maxTimelockMs = 30 * 24 * 60 * 60 * 1000;

const amountRaw = z.string().regex(/^[0-9]{1,78}$/);
const assetId = z.string().min(1).max(256);
const limitBucket = z.record(assetId, amountRaw);
const usdAmount = z.string().regex(/^(0|[1-9][0-9]{0,8})(\.[0-9]{1,2})?$/);
const policyActionSchema = z.enum(["swap", "transfer", "withdraw"]);
const nearRecipient = nearAccount.regex(
  /^(?:[a-z\d]+[-_])*[a-z\d]+(?:\.(?:[a-z\d]+[-_])*[a-z\d]+)*$/,
);

/** The NEAR Intents contracts; no native method ever signs for or calls them. */
export const intentsContracts: readonly string[] = ["intents.near", "intents.far"];

/** A NEP-413 recipient: a NEAR account or a domain, printable ASCII without spaces. */
export const nearSignRecipient = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[\x21-\x7e]+$/);

/** Up to 256 unique entries, never the NEAR Intents contracts. */
const nativeTargets = (what: string, target: z.ZodString = nearRecipient) =>
  z
    .array(target)
    .max(256)
    .refine((list) => new Set(list).size === list.length, `${what} must be unique`)
    .refine(
      (list) => !list.some((account) => intentsContracts.includes(account.toLowerCase())),
      "intents.near and intents.far can never be listed",
    );

/**
 * The EIP-712 `primaryType`s a listed domain admits: 1 to 32 unique, case-sensitive names. Absent
 * means any message type under the domain; `EIP712Domain` is the domain itself, never a message.
 */
const typedDataPrimaryTypesSchema = z
  .array(
    z
      .string()
      .min(1, "A message type cannot be empty")
      .max(256, "A message type is at most 256 characters")
      .refine((type) => type !== "EIP712Domain", "EIP712Domain is the domain, not a message type"),
  )
  .min(1, "Name at least one message type, or leave the field out")
  .max(32, "List at most 32 message types")
  .refine((list) => new Set(list).size === list.length, "Message types must be unique");

/**
 * One EIP-712 domain; typed data is signed only under a listed domain, matched field for field.
 * `primary_types` narrows which kind of message may be signed under it, not what the message says.
 */
export const typedDataDomainSchema = z
  .strictObject({
    name: z.string().min(1).max(128).optional(),
    version: z.string().min(1).max(64).optional(),
    chain_id: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
    verifying_contract: z
      .string()
      .regex(/^0x[0-9a-f]{40}$/, "Use the lowercase 0x address")
      .optional(),
    salt: z
      .string()
      .regex(/^0x[0-9a-f]{64}$/, "Use the lowercase 0x bytes32 salt")
      .optional(),
    primary_types: typedDataPrimaryTypesSchema.optional(),
  })
  .refine(
    (domain) => Object.keys(domain).some((key) => key !== "primary_types"),
    "A domain names at least one field",
  );
export type TypedDataDomain = z.infer<typeof typedDataDomainSchema>;

/**
 * The agent's own NEAR, EVM and Solana keys outside NEAR Intents, one switch per method. A list
 * switches a method on for exactly those targets; an empty list is off.
 */
export const nativeSchema = z.strictObject({
  near: z.strictObject({
    sign_message: nativeTargets("Recipients", nearSignRecipient),
    transfer: z.boolean(),
    call: nativeTargets("Contracts"),
  }),
  evm: z.strictObject({
    sign_typed_data: z
      .array(typedDataDomainSchema)
      .max(64)
      .refine(
        (list) => new Set(list.map((domain) => domainKey(domain))).size === list.length,
        "Domains must be unique",
      ),
    sign_message: z.boolean(),
    sign_transaction: z.boolean(),
  }),
  solana: z.strictObject({
    sign_message: z.boolean(),
    sign_transaction: z.boolean(),
  }),
});
export type NativePolicy = z.infer<typeof nativeSchema>;
assertType<Equal<NativePolicy, NonNullable<Policy["native"]>>>();
// The SDK's `Policy` is plain types that predate `primary_types`; the key set may only differ by it.
type SdkTypedDataDomain = NonNullable<Policy["native"]>["evm"]["sign_typed_data"][number];
assertType<Equal<keyof TypedDataDomain, keyof SdkTypedDataDomain | "primary_types">>();

/**
 * One domain's identity, independent of the order its fields were written in. The message types
 * are not part of it: the API keeps one entry per domain.
 */
export function domainKey(domain: TypedDataDomain): string {
  return JSON.stringify(
    Object.entries(domain)
      .filter(([key]) => key !== "primary_types")
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

/** The owner's complete rulebook for one agent account, signed as a whole. */
export const policySchema = z.strictObject({
  frozen: z.boolean(),
  actions: z
    .array(policyActionSchema)
    .max(policyActionSchema.options.length)
    .refine((actions) => new Set(actions).size === actions.length, "Actions must be unique"),
  confidential: z.boolean(),
  owner_approval: z.boolean(),
  assets: z.union([z.literal("any"), z.array(assetId).max(128)]),
  limits: z.strictObject({
    per_transaction: limitBucket.optional(),
    hourly: limitBucket.optional(),
    daily: limitBucket.optional(),
    monthly: limitBucket.optional(),
  }),
  max_actions_per_hour: z.number().int().positive().max(1_000_000).nullable(),
  destinations: destinationRuleSchema,
  budget: z.strictObject({
    daily_usd: usdAmount.nullable(),
    weekly_usd: usdAmount.nullable(),
    monthly_usd: usdAmount.nullable(),
  }),
  timelock_ms: z.number().int().min(0).max(maxTimelockMs),
  schedule: scheduleSchema.optional(),
  native: nativeSchema.optional(),
});
assertType<Equal<z.infer<typeof policySchema>, Policy>>();
// Optional keys pass the check above whatever their name, so the key sets are compared too.
assertType<Equal<keyof z.infer<typeof policySchema>, keyof Policy>>();

// ---- Ids and status

export const operationCorrelationIdSchema = z.string().regex(/^op_[A-Za-z0-9_-]{43}$/);
const intentCorrelationIdSchema = z.string().regex(/^intent_[A-Za-z0-9_-]{43}$/);
/** Tracking id of an execution or an owner intent. Never a destination for funds. */
export const correlationIdSchema = z.union([
  operationCorrelationIdSchema,
  intentCorrelationIdSchema,
]);

export const terminalStatuses: readonly Status[] = ["SUCCESS", "REFUNDED", "FAILED"];

/** The part of a grant this app reads from an issue result. */
export const issuedGrantSchema = z.object({ grant_id: hex64, expires_at: z.string() });

export const balanceQuerySchema = z.strictObject({
  source: z.enum(["public", "confidential"]).default("public"),
  asset: z.string().min(1).max(256).optional(),
});

// ---- Pass-through payloads

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown) => typeof value === "string";

/** What the wallet returned for each signing standard; the API verifies the signature itself. */
export const signedDataSchema = z.custom<SignedData>(
  (value) =>
    isRecord(value) &&
    isRecord(value.payload) &&
    (value.standard === "nep413"
      ? isString(value.public_key) && isString(value.signature)
      : value.standard === "nep366"
        ? isString(value.signed_delegate)
        : value.standard === "eip712"
          ? isString(value.signature)
          : value.standard === "webauthn" && isRecord(value.credential)),
  "Invalid signed data",
);

const intentTypes = [
  "agent_create",
  "policy_update",
  "agent_freeze",
  "agent_unfreeze",
  "grant_issue",
  "grant_revoke",
  "execution_cancel",
  "agent_archive",
  "agent_restore",
  "agent_delete",
  "approval_vote",
] as const satisfies readonly IntentType[];
assertType<Equal<(typeof intentTypes)[number], IntentType>>();

/** An owner intent to prepare. The API validates every field; the app routes on `type` and `agent_id`. */
export const generateIntentRequestSchema = z.custom<GenerateIntentRequest>(
  (value) =>
    isRecord(value) &&
    intentTypes.some((type) => type === value.type) &&
    (value.type === "agent_create" || isString(value.agent_id)),
  "Invalid intent request",
);

/** A prepared intent kept between page loads; the owner still signs exactly `intent.payload`. */
export const generateIntentResponseSchema = z.custom<GenerateIntentResponse>(
  (value) =>
    isRecord(value) &&
    typeof value.correlation_id === "string" &&
    intentCorrelationIdSchema.safeParse(value.correlation_id).success &&
    intentTypes.some((type) => type === value.type) &&
    isString(value.agent_id) &&
    value.status === "PENDING_SIGNATURE" &&
    isString(value.expires_at) &&
    ownerWalletSchema.safeParse(value.signer).success &&
    isRecord(value.intent) &&
    isString(value.intent.standard) &&
    isRecord(value.intent.payload) &&
    isRecord(value.preview) &&
    isString(value.preview.summary),
  "Invalid prepared intent",
);
