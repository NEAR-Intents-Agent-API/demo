import assert from "node:assert/strict";
import { test } from "node:test";

test("EVM login signs the issued SIWE nonce and stores the recovered key", async () => {
  const nonce = "ABC12345";
  const address = `0x${"a".repeat(40)}`;
  const previousFetch = globalThis.fetch;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let signedMessage = "";
  let storedKey = false;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { host: "localhost:3001", origin: "http://localhost:3001" },
      localStorage: undefined,
    },
  });
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/api/auth/siwe/nonce")) return Response.json({ nonce });
    if (url.endsWith("/api/auth/siwe/verify")) {
      const body = JSON.parse(String(init?.body)) as { message: string };
      return body.message.includes(`Nonce: ${nonce}`)
        ? Response.json({ success: true })
        : Response.json(
            { error: { code: "UNAUTHORIZED_INVALID_OR_EXPIRED_NONCE" } },
            { status: 401 },
          );
    }
    if (url.endsWith("/api/auth/evm-key")) {
      storedKey = true;
      return Response.json({ stored: true });
    }
    throw new Error(`unexpected_request:${url}`);
  };
  try {
    // The auth client captures `fetch` when its module loads, so import it after the stub.
    const { evmLogin } = await import("../../features/auth/providers.js");
    await evmLogin(address, async ({ method, params }) => {
      if (method === "eth_accounts") return [address];
      if (method === "eth_chainId") return "0xa4b1";
      if (method === "personal_sign") {
        signedMessage = Buffer.from(String(params?.[0]).slice(2), "hex").toString("utf8");
        return `0x${"b".repeat(130)}`;
      }
      throw new Error("unexpected_wallet_method");
    });
    assert.match(signedMessage, new RegExp(`Nonce: ${nonce}`));
    assert.equal(storedKey, true, "recovered key is stored after login");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
