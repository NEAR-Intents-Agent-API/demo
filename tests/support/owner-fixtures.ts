import { createHash, generateKeyPairSync, randomBytes, sign } from "node:crypto";
import type { OwnerWallet } from "@near-intents-agent-api/sdk";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

/** The wallet output sent with an owner-signed request: a signature or a WebAuthn assertion. */
type OwnerProof = { signature: string } | { authentication: Record<string, unknown> };

/** Sorted-key JSON, the exact bytes the API asks owners to sign. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  const result = JSON.stringify(value);
  if (result === undefined) throw new Error("Value is not JSON");
  return result;
}

export function externalOwnerFixture(
  type: "evm" | "passkey",
  passkeyOptions: { flags?: number; counter?: number; crossOrigin?: boolean } = {},
): {
  owner: OwnerWallet;
  proof: (message: unknown) => OwnerProof;
} {
  switch (type) {
    case "evm": {
      const key = secp256k1.keygen();
      const address = `0x${Buffer.from(
        keccak_256(secp256k1.getPublicKey(key.secretKey, false).subarray(1)),
      )
        .subarray(12)
        .toString("hex")}`;
      return {
        owner: {
          type,
          address,
          chain_id: 11155111,
          public_key: `0x${Buffer.from(secp256k1.getPublicKey(key.secretKey, false).subarray(1)).toString("hex")}`,
        },
        proof(message) {
          const bytes = Buffer.from(canonical(message));
          const digest = keccak_256(
            Buffer.concat([Buffer.from(`\x19Ethereum Signed Message:\n${bytes.length}`), bytes]),
          );
          const signed = secp256k1.sign(digest, key.secretKey, {
            prehash: false,
            format: "recovered",
          });
          const recovery = signed[0];
          if (recovery === undefined) throw new Error("Missing recovery byte");
          return {
            signature: `0x${Buffer.concat([signed.subarray(1), Buffer.from([recovery + 27])]).toString("hex")}`,
          };
        },
      };
    }
    case "passkey": {
      const key = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
      const owner = {
        type,
        credential_id: randomBytes(32).toString("base64url"),
        public_key: key.publicKey.export({ format: "der", type: "spki" }).toString("base64url"),
        rp_id: "partner.test",
        origin: "https://partner.test",
      } as const;
      let counter = passkeyOptions.counter ?? 0;
      return {
        owner,
        proof(message) {
          const client = Buffer.from(
            JSON.stringify({
              type: "webauthn.get",
              challenge: createHash("sha256").update(canonical(message)).digest("base64url"),
              origin: owner.origin,
              crossOrigin: passkeyOptions.crossOrigin ?? false,
            }),
          );
          const auth = Buffer.alloc(37);
          createHash("sha256").update(owner.rp_id).digest().copy(auth);
          auth[32] = passkeyOptions.flags ?? 5;
          auth.writeUInt32BE(++counter, 33);
          const signature = sign(
            "sha256",
            Buffer.concat([auth, createHash("sha256").update(client).digest()]),
            key.privateKey,
          );
          return {
            authentication: {
              id: owner.credential_id,
              rawId: owner.credential_id,
              type: "public-key",
              clientExtensionResults: {},
              response: {
                clientDataJSON: client.toString("base64url"),
                authenticatorData: auth.toString("base64url"),
                signature: signature.toString("base64url"),
              },
            },
          };
        },
      };
    }
  }
}
