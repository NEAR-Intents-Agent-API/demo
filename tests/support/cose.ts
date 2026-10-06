import { createPublicKey } from "node:crypto";
import { isoCBOR } from "@simplewebauthn/server/helpers";

/** The COSE key WebAuthn verification expects, from stored SPKI metadata. */
export function cosePublicKeyFromSpki(spkiBase64url: string) {
  const key = createPublicKey({
    key: Buffer.from(spkiBase64url, "base64url"),
    format: "der",
    type: "spki",
  }).export({ format: "jwk" });
  if (key.kty !== "EC" || key.crv !== "P-256" || !key.x || !key.y)
    throw new Error("passkey_algorithm_unsupported");
  return isoCBOR.encode(
    new Map<number, number | Uint8Array>([
      [1, 2],
      [3, -7],
      [-1, 1],
      [-2, Buffer.from(key.x, "base64url")],
      [-3, Buffer.from(key.y, "base64url")],
    ]),
  );
}
