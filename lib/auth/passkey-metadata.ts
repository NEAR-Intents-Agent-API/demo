import { createPublicKey } from "node:crypto";
import {
  convertCOSEtoPKCS,
  cose,
  decodeAttestationObject,
  decodeCredentialPublicKey,
  parseAuthenticatorData,
} from "@simplewebauthn/server/helpers";

/** Adapt Better Auth's public credential metadata to the Agent API owner descriptor. */
export function spkiFromCoseBase64(coseBase64: string): string {
  const bytes = new Uint8Array(Buffer.from(coseBase64, "base64"));
  if (decodeCredentialPublicKey(bytes).get(cose.COSEKEYS.alg) !== -7)
    throw new Error("passkey_algorithm_unsupported");
  const point = convertCOSEtoPKCS(bytes);
  if (point[0] !== 0x04 || point.length !== 65) throw new Error("passkey_algorithm_unsupported");
  return createPublicKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: Buffer.from(point.subarray(1, 33)).toString("base64url"),
      y: Buffer.from(point.subarray(33)).toString("base64url"),
    },
    format: "jwk",
  })
    .export({ format: "der", type: "spki" })
    .toString("base64url");
}

/** Check signing compatibility before Better Auth stores a new credential. */
export function coseAlgorithmFromRegistration(response: Record<string, unknown>): number | null {
  const inner = response.response;
  const attestation =
    typeof response.attestationObject === "string"
      ? response.attestationObject
      : inner && typeof inner === "object"
        ? (inner as { attestationObject?: unknown }).attestationObject
        : undefined;
  if (typeof attestation !== "string") return null;
  try {
    const decoded = decodeAttestationObject(new Uint8Array(Buffer.from(attestation, "base64url")));
    const { credentialPublicKey } = parseAuthenticatorData(decoded.get("authData"));
    if (!credentialPublicKey) return null;
    return decodeCredentialPublicKey(credentialPublicKey).get(cose.COSEKEYS.alg) ?? null;
  } catch {
    return null;
  }
}
