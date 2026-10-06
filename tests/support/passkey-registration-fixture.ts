import {
  createHash,
  createSign,
  generateKeyPairSync,
  type KeyObject,
  webcrypto,
} from "node:crypto";

/**
 * Minimal CBOR writer for the two structures WebAuthn registration needs: the COSE ES256 key
 * and the attestation object. Kept local to the test fixture so no production package exports
 * CBOR encoding just for tests.
 */
class Cbor {
  private readonly chunks: Buffer[] = [];

  private head(major: number, value: number): this {
    if (value < 24) this.chunks.push(Buffer.from([(major << 5) | value]));
    else if (value < 256) this.chunks.push(Buffer.from([(major << 5) | 24, value]));
    else this.chunks.push(Buffer.from([(major << 5) | 25, value >> 8, value & 0xff]));
    return this;
  }

  uint(value: number): this {
    return this.head(0, value);
  }

  negInt(value: number): this {
    return this.head(1, -1 - value);
  }

  bytes(value: Uint8Array | Buffer): this {
    this.head(2, value.length);
    this.chunks.push(Buffer.from(value));
    return this;
  }

  text(value: string): this {
    const bytes = Buffer.from(value, "utf8");
    this.head(3, bytes.length);
    this.chunks.push(bytes);
    return this;
  }

  map(entries: Array<[string | number, (cbor: Cbor) => void]>): this {
    this.head(5, entries.length);
    for (const [key, write] of entries) {
      if (typeof key === "string") this.text(key);
      else if (key >= 0) this.uint(key);
      else this.negInt(key);
      write(this);
    }
    return this;
  }

  build(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

const coseEs256Key = (x: Buffer, y: Buffer) =>
  new Cbor()
    .map([
      [1, (c) => c.uint(2)],
      [3, (c) => c.negInt(-7)],
      [-1, (c) => c.uint(1)],
      [-2, (c) => c.bytes(x)],
      [-3, (c) => c.bytes(y)],
    ])
    .build();

const attestationObject = (authData: Buffer) =>
  new Cbor()
    .map([
      ["fmt", (c) => c.text("none")],
      ["attStmt", (c) => c.map([])],
      ["authData", (c) => c.bytes(authData)],
    ])
    .build();

/**
 * Builds a valid ES256 "none"-attestation registration response the passkey plugin accepts.
 * The private key stays in-process; only public metadata is sent, mirroring a real
 * authenticator.
 */
export type SyntheticPasskey = {
  credentialId: string;
  counter: number;
  registration: (input: { challenge: string; rpId: string; origin: string }) => unknown;
  authentication: (input: {
    challenge: string;
    rpId: string;
    origin: string;
    userVerified?: boolean;
  }) => unknown;
};

/**
 * One in-memory authenticator: register once, then produce assertions with an advancing
 * counter, exactly like a real platform passkey.
 */
export function syntheticPasskey(): SyntheticPasskey {
  const key = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const credentialId = Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString(
    "base64url",
  );
  let counter = 0;
  const authDataFor = (rpId: string, flags: number, signable: boolean) => {
    const header = Buffer.concat([
      createHash("sha256").update(rpId).digest(),
      Buffer.from([flags]),
      (() => {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(counter, 0);
        return buffer;
      })(),
    ]);
    if (!signable) return header;
    const credentialIdBytes = Buffer.from(credentialId, "base64url");
    const length = Buffer.alloc(2);
    length.writeUInt16BE(credentialIdBytes.length, 0);
    const jwk = key.publicKey.export({ format: "jwk" });
    if (!jwk.x || !jwk.y) throw new Error("missing jwk coordinates");
    return Buffer.concat([
      header,
      Buffer.alloc(16),
      length,
      credentialIdBytes,
      coseEs256Key(Buffer.from(jwk.x, "base64url"), Buffer.from(jwk.y, "base64url")),
    ]);
  };
  return {
    credentialId,
    get counter() {
      return counter;
    },
    registration({ challenge, rpId, origin }) {
      const clientDataJSON = Buffer.from(
        JSON.stringify({ type: "webauthn.create", challenge, origin, crossOrigin: false }),
      ).toString("base64url");
      return {
        id: credentialId,
        rawId: credentialId,
        type: "public-key",
        clientExtensionResults: {},
        response: {
          clientDataJSON,
          attestationObject: attestationObject(authDataFor(rpId, 0x45, true)).toString("base64url"),
          transports: ["internal"],
        },
      };
    },
    authentication({ challenge, rpId, origin, userVerified = true }) {
      counter += 1;
      const clientDataJSON = Buffer.from(
        JSON.stringify({ type: "webauthn.get", challenge, origin, crossOrigin: false }),
      ).toString("base64url");
      const authData = authDataFor(rpId, userVerified ? 0x05 : 0x01, false);
      const signature = es256Sign(
        key.privateKey,
        Buffer.concat([
          authData,
          createHash("sha256").update(Buffer.from(clientDataJSON, "base64url")).digest(),
        ]),
      );
      return {
        id: credentialId,
        rawId: credentialId,
        type: "public-key",
        clientExtensionResults: {},
        response: {
          clientDataJSON,
          authenticatorData: authData.toString("base64url"),
          signature: signature.toString("base64url"),
        },
      };
    },
  };
}

/** WebAuthn ES256 signatures are DER-encoded, which is exactly what `createSign` emits. */
function es256Sign(privateKey: KeyObject, data: Buffer): Buffer {
  const signer = createSign("sha256");
  signer.update(data);
  return signer.sign(privateKey);
}
