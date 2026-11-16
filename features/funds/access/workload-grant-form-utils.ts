import type { z } from "zod";
import { publicKeyJwkSchema, workloadCredentialSchema } from "@/lib/agent-api/schemas";
import { jwkThumbprintUri } from "@/lib/agent-api/workload-grants";

/**
 * What an owner types to bind a grant to a workload, and what is signed from it. The API checks
 * every credential in full (`grant_credential_invalid`); these checks only catch mistakes before
 * the owner is asked to sign.
 */

export type WorkloadKind = "oidc" | "public_key";
export type WorkloadCredential = z.infer<typeof workloadCredentialSchema>;
export type ClaimDraft = { id: number; name: string; value: string };

export type IssuerPresetId = "github" | "gitlab" | "google" | "entra" | "custom";

export type IssuerPreset = {
  id: IssuerPresetId;
  label: string;
  /** Fixed for a platform with one issuer; owner-typed for the others. */
  issuer: string;
  /** Claims every binding of this platform must pin, offered as empty rows to fill in. */
  claims: string[];
  /** Claims the owner may add, one of which the platform requires. */
  suggestions: string[];
  hint: string;
};

export const ISSUER_PRESETS: readonly IssuerPreset[] = [
  {
    id: "github",
    label: "GitHub Actions",
    issuer: "https://token.actions.githubusercontent.com",
    claims: ["repository_owner_id", "repository_id"],
    suggestions: ["environment", "ref", "job_workflow_ref", "workflow_ref"],
    hint: "Pin the numeric ids, never names (a repository can be renamed). Also pin one of environment, ref, job_workflow_ref or workflow_ref.",
  },
  {
    id: "gitlab",
    label: "GitLab CI",
    issuer: "https://gitlab.com",
    claims: ["namespace_id", "project_id"],
    suggestions: ["ref_type", "ref", "environment", "ci_config_ref_uri"],
    hint: "Pin the numeric ids. Also pin one of ref, environment or ci_config_ref_uri; whenever you pin ref, pin ref_type too.",
  },
  {
    id: "google",
    label: "Google Cloud",
    issuer: "https://accounts.google.com",
    claims: ["sub"],
    suggestions: [],
    hint: "sub is the service account's unique id (not its email, which can be reused).",
  },
  {
    id: "entra",
    label: "Microsoft Entra ID",
    issuer: "https://sts.windows.net/<tenant>/",
    claims: ["oid"],
    suggestions: ["idtyp"],
    hint: "oid is the identity's object id. Pin idtyp = app too, so a user's token never matches.",
  },
  {
    id: "custom",
    label: "Other issuer",
    issuer: "",
    claims: ["sub"],
    suggestions: ["/kubernetes.io/serviceaccount/uid"],
    hint: "For a cluster, pin sub and /kubernetes.io/serviceaccount/uid. An issuer the API does not know needs its signing keys signed below.",
  },
];

export function presetById(id: IssuerPresetId): IssuerPreset {
  return (
    ISSUER_PRESETS.find((preset) => preset.id === id) ?? (ISSUER_PRESETS.at(-1) as IssuerPreset)
  );
}

/** Only these presets let the owner type the issuer URL. */
export const issuerIsEditable = (id: IssuerPresetId) => id === "entra" || id === "custom";

let nextClaimId = 0;
export function claimDraft(name = "", value = ""): ClaimDraft {
  nextClaimId += 1;
  return { id: nextClaimId, name, value };
}

export type WorkloadProblems = {
  issuer?: string;
  audience?: string;
  claims?: string;
  jwks?: string;
  key?: string;
};

export type OidcDraft = {
  preset: IssuerPresetId;
  issuer: string;
  /** Microsoft Entra ID only: the audience its tokens carry. */
  audience: string;
  claims: ClaimDraft[];
  /** Pasted JWKS of an issuer the API does not know, or empty. */
  jwks: string;
};

type Built =
  | { credential: WorkloadCredential; problems?: undefined }
  | { credential?: undefined; problems: WorkloadProblems };

function parseJson(text: string): { value: unknown } | { error: string } {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return { error: "This is not valid JSON" };
  }
}

const claimValuePattern = /^[\x20-\x7e]{1,256}$/;

/** What is wrong with the pinned claims, or null; empty rows are not claims. */
function claimsProblem(claims: readonly ClaimDraft[]): string | null {
  const names = claims.map((claim) => claim.name.trim());
  if (claims.length === 0) return "Pin at least one claim";
  if (claims.length > 16) return "Pin at most 16 claims";
  if (claims.some((claim) => !claim.name.trim() || !claim.value.trim()))
    return "Give every claim a name and a value, or remove it";
  if (new Set(names).size !== names.length) return "Each claim can be pinned once";
  if (claims.some((claim) => !claimValuePattern.test(claim.value.trim())))
    return "Claim values are up to 256 characters of plain letters, numbers and punctuation";
  return null;
}

/** Problems found by the full schema, in the words of the field they are about. */
function schemaProblems(failed: unknown): WorkloadProblems {
  if (failed === "jwks")
    return {
      jwks: 'Paste the issuer\'s public keys as {"keys": [...]}: up to four RSA, P-256, P-384 or Ed25519 keys with no private members',
    };
  if (failed === "claims")
    return {
      claims:
        "A claim name is a plain name or a JSON pointer such as /kubernetes.io/serviceaccount/uid; iss, aud, exp, nbf, iat and jti cannot be pinned",
    };
  return { issuer: "This issuer or audience is not valid" };
}

const issuerIsValid = (issuer: string) =>
  /^https:\/\/[!-~]+$/.test(issuer) && issuer.length <= 256 && !issuer.includes("<");

/** The OIDC credential to sign, or the problems that stop it. */
export function buildOidcCredential(draft: OidcDraft): Built {
  const problems: WorkloadProblems = {};
  const issuer = (
    issuerIsEditable(draft.preset) ? draft.issuer : presetById(draft.preset).issuer
  ).trim();
  if (!issuerIsValid(issuer))
    problems.issuer = "Enter the issuer's exact https URL, as its tokens state it in iss";

  const claims = draft.claims.filter((claim) => claim.name.trim() || claim.value.trim());
  const claimProblem = claimsProblem(claims);
  if (claimProblem) problems.claims = claimProblem;

  const audience = draft.preset === "entra" ? draft.audience.trim() : "";
  if (draft.preset === "entra" && !audience)
    problems.audience =
      "Enter the audience Entra ID tokens carry: the client id, or api://… for v1.0 tokens";

  const signedKeys = draft.preset === "custom" ? draft.jwks.trim() : "";
  const jwks = signedKeys ? parseJson(signedKeys) : null;
  if (jwks && "error" in jwks) problems.jwks = jwks.error;

  if (Object.keys(problems).length > 0) return { problems };
  const result = workloadCredentialSchema.safeParse({
    type: "oidc",
    issuer,
    // Every other issuer's audience is filled in by the API, which refuses one sent here.
    ...(audience ? { audience } : {}),
    claims: Object.fromEntries(claims.map((claim) => [claim.name.trim(), claim.value.trim()])),
    ...(jwks && "value" in jwks ? { jwks: jwks.value } : {}),
  });
  if (result.success) return { credential: result.data };
  return { problems: schemaProblems(result.error.issues[0]?.path[0]) };
}

/** The pasted public JWK, as the credential to sign, or why it cannot be. */
export function buildKeyCredential(text: string): Built {
  if (!text.trim()) return { problems: { key: "Paste the workload's public key (JWK)" } };
  const parsed = parseJson(text);
  if ("error" in parsed) return { problems: { key: parsed.error } };
  const value = parsed.value;
  if (typeof value === "object" && value !== null && "d" in value)
    return {
      problems: {
        key: "This includes a private key (d). Paste the public key only; the private key stays on the workload",
      },
    };
  const result = publicKeyJwkSchema.safeParse(value);
  if (!result.success)
    return {
      problems: {
        key: "Paste an Ed25519 key {kty: OKP, crv: Ed25519, x} or a P-256 key {kty: EC, crv: P-256, x, y}, with no other members",
      },
    };
  return { credential: { type: "public_key", jwk: result.data } };
}

/** The thumbprint of a pasted key, shown so the owner can match it with the workload's; null while it is not a key. */
export function pastedKeyThumbprint(text: string): string | null {
  const built = buildKeyCredential(text);
  return built.credential?.type === "public_key" ? jwkThumbprintUri(built.credential.jwk) : null;
}
