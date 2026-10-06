import { createHash } from "node:crypto";

/** NEP-413 digest: sha256 of the tag, the borsh-encoded payload and a null callback URL. */
export function ownerNep413SigningDigest(input: {
  message: string;
  recipient: string;
  nonce: Uint8Array;
}): Buffer {
  if (input.nonce.length !== 32) throw new Error("NEP-413 nonce must be 32 bytes");
  const encodeString = (value: string) => {
    const bytes = Buffer.from(value);
    const length = Buffer.alloc(4);
    length.writeUInt32LE(bytes.length);
    return Buffer.concat([length, bytes]);
  };
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32LE(2147484061);
  return createHash("sha256")
    .update(
      Buffer.concat([
        prefix,
        encodeString(input.message),
        Buffer.from(input.nonce),
        encodeString(input.recipient),
        Buffer.from([0]),
      ]),
    )
    .digest();
}
