import type { GrantCredentialType, GrantView } from "@near-intents-agent-api/sdk";
import { sha256 } from "@noble/hashes/sha2.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";
import { base64urlnopad } from "@scure/base";
import { parseWorkloadCredential, type SignedWorkloadCredential } from "./schemas";

/**
 * How a grant's holder proves itself, and how the dashboard words it. Pure and free of the SDK's
 * runtime so the signing summary in the browser and the server routes read a credential the same
 * way. Nothing here is invented: every fact comes from the signed message or is derived from it.
 */

export const GRANT_KIND_LABEL: Record<GrantCredentialType, string> = {
  token: "Token",
  oidc: "Workload identity (OIDC)",
  public_key: "Workload key",
};

/** Platforms whose issuer URL is one fixed string, so the signed issuer names them exactly. */
const PLATFORM_ISSUERS: Record<string, string> = {
  "https://token.actions.githubusercontent.com": "GitHub Actions",
  "https://gitlab.com": "GitLab CI",
  "https://accounts.google.com": "Google Cloud",
};

/** The platform a signed issuer URL names, or null for any other issuer. */
export function issuerPlatform(issuer: string): string | null {
  return Object.hasOwn(PLATFORM_ISSUERS, issuer) ? (PLATFORM_ISSUERS[issuer] ?? null) : null;
}

type Jwk = { kty: string; crv?: string; x?: string; y?: string; n?: string; e?: string };

/**
 * RFC 7638 SHA-256 thumbprint of a public key, over its required members only (so `kid`, `alg`
 * and `use` never change it): what the API's own signing summary quotes for each key.
 */
export function jwkThumbprint(jwk: Jwk): string {
  const members =
    jwk.kty === "RSA"
      ? { e: jwk.e, kty: jwk.kty, n: jwk.n }
      : jwk.kty === "OKP"
        ? { crv: jwk.crv, kty: jwk.kty, x: jwk.x }
        : { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
  // RFC 7638 orders the required members lexicographically, as written above.
  return base64urlnopad.encode(sha256(utf8ToBytes(JSON.stringify(members))));
}

/** RFC 9278 thumbprint URI: the `iss` and `sub` of every assertion and proof the key signs. */
export function jwkThumbprintUri(jwk: Jwk): string {
  return `urn:ietf:params:oauth:jwk-thumbprint:sha-256:${jwkThumbprint(jwk)}`;
}

/** What one grant's credential says, in the words the dashboard shows. */
export type CredentialBinding =
  | { type: "token" }
  | {
      type: "oidc";
      issuer: string;
      /** Set when the issuer is exactly a well-known platform's. */
      platform: string | null;
      audience: string;
      claims: { name: string; value: string }[];
      /** Thumbprints of issuer keys the owner signed into the grant, in signed order. */
      signedKeys: string[];
    }
  | { type: "public_key"; curve: "Ed25519" | "P-256"; thumbprint: string };

function bindingOf(credential: SignedWorkloadCredential): CredentialBinding {
  if (credential.type === "public_key")
    return {
      type: "public_key",
      curve: credential.jwk.crv,
      thumbprint: jwkThumbprintUri(credential.jwk),
    };
  return {
    type: "oidc",
    issuer: credential.issuer,
    platform: issuerPlatform(credential.issuer),
    audience: credential.audience,
    claims: Object.entries(credential.claims).map(([name, value]) => ({ name, value })),
    signedKeys: (credential.jwks?.keys ?? []).map(jwkThumbprint),
  };
}

/**
 * The binding of a grant view, or null when its signed credential is not one this app reads (a
 * credential type added after this build): the caller then shows the type and nothing more.
 */
export function grantBinding(
  grant: Pick<GrantView, "credential_type" | "owner_message">,
): CredentialBinding | null {
  const credential = grant.owner_message.credential;
  if (typeof credential === "string")
    return grant.credential_type === "token" ? { type: "token" } : null;
  const parsed = parseWorkloadCredential(credential);
  return parsed && parsed.type === grant.credential_type ? bindingOf(parsed) : null;
}

/** The signed token commitment of a grant, or null when its credential is not a grant token. */
export function tokenCommitment(grant: Pick<GrantView, "owner_message">): string | null {
  const credential = grant.owner_message.credential;
  return typeof credential === "string" ? credential : null;
}

/** Pinned claims as `name=value`, in signed order. */
export function claimsText(claims: readonly { name: string; value: string }[]): string {
  return claims.map((claim) => `${claim.name}=${claim.value}`).join(", ");
}
