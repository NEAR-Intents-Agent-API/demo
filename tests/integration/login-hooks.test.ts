import assert from "node:assert/strict";
import { test } from "node:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createSiweMessage } from "viem/siwe";
import { createDemoAuth } from "../../lib/auth/server";
import { demoConfig, parseDemoEnv } from "../../lib/config/env";
import { walletAddress } from "../../lib/db/schema";
import { createDemoTestDatabase } from "../../lib/db/testing";

const origin = "https://demo.example.test";
const config = demoConfig(
  parseDemoEnv({
    NEAR_INTENTS_AGENT_API_URL: "https://api.example.test",
    NEAR_INTENTS_AGENT_API_KEY: "naa_example_key",
    BETTER_AUTH_SECRET: "test-only-demo-auth-secret-32-chars",
    SECRET_ENCRYPTION_KEY: "test-only-demo-encryption-key-32-chars",
  }),
  origin,
);

async function setup() {
  const database = await createDemoTestDatabase();
  const auth = createDemoAuth(database, config);
  const post = (path: string, body: unknown) =>
    auth.handler(
      new Request(`${origin}/api/auth${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin },
        body: JSON.stringify(body),
      }),
    );
  return { database, post };
}

test("a NEAR login signed for another recipient or message is refused before the plugin", async () => {
  const { database, post } = await setup();
  const attempt = (recipient: string, message: string) =>
    post("/near/verify", {
      signedMessage: { accountId: "owner.near", publicKey: "ed25519:key", signature: "sig" },
      message,
      recipient,
      nonce: "00".repeat(32),
      accountId: "owner.near",
    });
  try {
    for (const [recipient, message] of [
      ["evil.test", "Sign in to evil.test"],
      ["demo.example.test", "Sign in to evil.test"],
      ["demo.example.test", "Sign in to demo.example.test and send funds"],
    ] as const) {
      const response = await attempt(recipient, message);
      assert.equal(response.status, 401, `${recipient}|${message}`);
      assert.equal((await response.json()).code, "NEAR_LOGIN_MISMATCH");
    }
    // This app's own host passes the gate; the plugin then rejects the fake signature.
    const accepted = await attempt("demo.example.test", "Sign in to demo.example.test");
    assert.notEqual((await accepted.json().catch(() => ({}))).code, "NEAR_LOGIN_MISMATCH");
  } finally {
    await database.close();
  }
});

test("a SIWE login stores the wallet public key for owner proofs", async () => {
  const { database, post } = await setup();
  const account = privateKeyToAccount(generatePrivateKey());
  try {
    const { nonce } = await (await post("/siwe/nonce", {})).json();
    const message = createSiweMessage({
      address: account.address,
      chainId: 1,
      domain: "demo.example.test",
      uri: origin,
      nonce,
      version: "1",
    });
    const signature = await account.signMessage({ message });
    const response = await post("/siwe/verify", { message, signature });
    assert.equal(response.status, 200, await response.clone().text());
    const [row] = await database.db.select().from(walletAddress);
    assert.equal(row?.address, account.address);
    assert.equal(row?.publicKey, `0x${account.publicKey.slice(4)}`);
  } finally {
    await database.close();
  }
});
