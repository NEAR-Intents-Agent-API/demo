import { createHash } from "node:crypto";
import type {
  AgentApi,
  GenerateIntentRequest,
  GenerateIntentResponse,
  Intent,
  IntentType,
  SignedData,
  StatusResponseOf,
} from "@near-intents-agent-api/sdk";
import { p256 } from "@noble/curves/nist.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { base58 } from "@scure/base";
import {
  actions,
  encodeDelegateAction,
  encodeSignedDelegate,
  type KeyPair,
  Signature,
} from "near-api-js";
import { ownerNep413SigningDigest } from "./nep413.js";

/**
 * Wallet doubles for generated intents. Each returns exactly what a real wallet returns for the
 * standard, so tests exercise the server's normalization instead of pre-normalizing:
 * - NEAR: base64 NEP-413 signatures and a base64 borsh `SignedDelegate`, like near-connect;
 * - EVM: a `0x` r‖s‖v signature with v = 27/28, like `eth_signTypedData_v4`;
 * - passkey: a WebAuthn `AuthenticationResponseJSON` with a DER signature.
 */
export type IntentSigner = { sign(intent: Intent): SignedData };

export function nearIntentSigner(keyPair: KeyPair, accountId: string): IntentSigner {
  return {
    sign(intent) {
      if (intent.standard === "nep413") {
        const digest = ownerNep413SigningDigest({
          message: intent.payload.message,
          recipient: intent.payload.recipient,
          nonce: Buffer.from(intent.payload.nonce, "base64"),
        });
        return {
          ...intent,
          public_key: keyPair.getPublicKey().toString(),
          signature: Buffer.from(keyPair.sign(digest).signature).toString("base64"),
        };
      }
      if (intent.standard === "nep366") {
        const delegateAction = {
          senderId: accountId,
          receiverId: intent.payload.receiverId,
          publicKey: keyPair.getPublicKey(),
          nonce: 1n,
          maxBlockHeight: 100n,
          actions: intent.payload.actions.map((action) =>
            actions.functionCall(
              action.params.methodName,
              Buffer.from(JSON.stringify(action.params.args)),
              BigInt(action.params.gas),
              BigInt(action.params.deposit),
            ),
          ),
        };
        const digest = createHash("sha256").update(encodeDelegateAction(delegateAction)).digest();
        const signedDelegate = Buffer.from(
          encodeSignedDelegate({
            delegateAction,
            signature: new Signature({ keyType: 0, data: keyPair.sign(digest).signature }),
          }),
        ).toString("base64");
        return { ...intent, signed_delegate: signedDelegate };
      }
      throw new Error(`near signer cannot sign ${intent.standard}`);
    },
  };
}

type TypedData = Extract<Intent, { standard: "eip712" }>["payload"];

/** EIP-712 digest for the string/uint32 struct types the NEAR wallet contract uses. */
export function eip712Digest(typed: TypedData): Uint8Array {
  const hash = (value: string) => keccak_256(Buffer.from(value));
  const encodeStruct = (name: string, value: Record<string, unknown>) => {
    const fields = typed.types[name] ?? [];
    const typeHash = hash(
      `${name}(${fields.map((field) => `${field.type} ${field.name}`).join(",")})`,
    );
    const words = fields.map((field) => {
      const entry = value[field.name];
      if (field.type === "string") return hash(String(entry));
      if (field.type.startsWith("uint")) {
        const word = Buffer.alloc(32);
        word.writeUInt32BE(Number(entry), 28);
        return word;
      }
      throw new Error(`unsupported EIP-712 field type ${field.type}`);
    });
    return keccak_256(Buffer.concat([typeHash, ...words]));
  };
  const domain = encodeStruct("EIP712Domain", typed.domain);
  const message = encodeStruct(typed.primaryType, typed.message);
  return keccak_256(Buffer.concat([Buffer.from([0x19, 0x01]), domain, message]));
}

export function evmIntentSigner(secretKeyHex: string): IntentSigner {
  const secretKey = Buffer.from(secretKeyHex, "hex");
  return {
    sign(intent) {
      if (intent.standard !== "eip712")
        throw new Error(`evm signer cannot sign ${intent.standard}`);
      const recovered = secp256k1.sign(eip712Digest(intent.payload), secretKey, {
        prehash: false,
        format: "recovered",
      });
      const recovery = recovered[0] ?? 0;
      const signature = `0x${Buffer.from(recovered.subarray(1)).toString("hex")}${(27 + recovery).toString(16)}`;
      return { ...intent, signature };
    },
  };
}

/** A synthetic platform authenticator. `sign` answers `navigator.credentials.get`. */
export function passkeyIntentSigner(authenticator: {
  owner: { credential_id: string; rp_id: string; origin: string };
  assert(challenge: Uint8Array): {
    authenticatorData: Buffer;
    clientDataJSON: string;
    signature: Uint8Array;
  };
}): IntentSigner {
  return {
    sign(intent) {
      if (intent.standard !== "webauthn")
        throw new Error(`passkey signer cannot sign ${intent.standard}`);
      const assertion = authenticator.assert(Buffer.from(intent.payload.challenge, "base64url"));
      const der = p256.Signature.fromBytes(assertion.signature, "compact").toBytes("der");
      return {
        ...intent,
        credential: {
          id: authenticator.owner.credential_id,
          rawId: authenticator.owner.credential_id,
          type: "public-key",
          response: {
            clientDataJSON: Buffer.from(assertion.clientDataJSON).toString("base64url"),
            authenticatorData: assertion.authenticatorData.toString("base64url"),
            signature: Buffer.from(der).toString("base64url"),
          },
          clientExtensionResults: {},
        },
      };
    },
  };
}

/** `p256:<base58>` compact signature, as the NEP-616 wallet stores it, back to raw bytes. */
export function compactP256(signature: string) {
  return base58.decode(signature.slice(5));
}

/** generate-intent → wallet signs → submit-intent, in one test step. */
export async function runIntent<T extends IntentType>(
  api: AgentApi,
  request: Extract<GenerateIntentRequest, { type: T }>,
  signer: IntentSigner,
  options: { idempotencyKey?: string } = {},
): Promise<{ generated: GenerateIntentResponse; status: StatusResponseOf<T> }> {
  const generated = await api.generateIntent(request, options);
  const status = await api.submitIntent({
    type: request.type,
    correlation_id: generated.correlation_id,
    signed_data: signer.sign(generated.intent),
  });
  return { generated, status };
}
