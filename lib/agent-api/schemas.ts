import type {
  Destination,
  DestinationRule,
  GenerateIntentRequest,
  GenerateIntentResponse,
  IntentType,
  OwnerWallet,
  Policy,
  SignedData,
  Status,
} from "@near-intents-agent-api/sdk";
import { z } from "zod";

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

/** Chains whose accounts are `0x` EVM addresses, in canonical ids. */
const evmChains = new Set([
  "eth",
  "base",
  "arb",
  "bsc",
  "pol",
  "op",
  "avax",
  "gnosis",
  "bera",
  "plasma",
  "hood",
  "hypercore",
  "monad",
  "xlayer",
  "scroll",
  "abs",
]);

/** One place funds may go, named exactly. No wildcards. */
export const destinationSchema = z
  .discriminatedUnion("action", [
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
  ])
  .superRefine((value, ctx) => {
    if (value.action !== "withdraw") return;
    if (canonicalChain(value.chain) !== value.chain)
      ctx.addIssue({ code: "custom", message: "Use the canonical chain identifier" });
    if (evmChains.has(value.chain) && !/^0x[0-9a-f]{40}$/.test(value.address))
      ctx.addIssue({
        code: "custom",
        message: "EVM destinations must use canonical lowercase hex addresses",
      });
  });
assertType<Equal<z.infer<typeof destinationSchema>, Destination>>();

/** Exact identity for comparison: canonical chain id, lowercase EVM hex; a memo is never altered. */
export function canonicalDestination(input: Destination): Destination {
  if (input.action === "transfer") return destinationSchema.parse(input);
  const chain = canonicalChain(input.chain);
  const address = evmChains.has(chain) ? input.address.toLowerCase() : input.address;
  return destinationSchema.parse({ ...input, chain, address });
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

/** A new account sends nowhere until the owner lists a destination. */
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
  sign_message: z
    .strictObject({
      recipients: z
        .array(nearRecipient)
        .min(1)
        .max(256)
        .refine((list) => new Set(list).size === list.length, "Recipients must be unique"),
    })
    .optional(),
});
assertType<Equal<z.infer<typeof policySchema>, Policy>>();

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
