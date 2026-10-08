import assert from "node:assert/strict";
import { test } from "node:test";
import type { GenerateIntentResponse } from "@near-intents-agent-api/sdk";
import { signIntent } from "../../features/wallet/sign-intent";
import { nearLoginMessage } from "../../lib/near/login";
import type { OwnerConnector } from "../../lib/near/wallet";

test("login message names the host, including a local port", () => {
  for (const host of ["localhost:3001", "demo.example.com"])
    assert.equal(nearLoginMessage(host), `Sign in to ${host}`);
});

const request = {
  signer: { type: "near", account_id: "alice.near", public_key: `ed25519:${"1".repeat(32)}` },
  intent: {
    standard: "nep413",
    payload: {
      message: "exact server intent",
      recipient: "api.example.com",
      nonce: Buffer.alloc(32, 7).toString("base64"),
    },
  },
} satisfies Pick<GenerateIntentResponse, "intent" | "signer">;

test("owner signing after refresh uses restored wallet without another login", async () => {
  let signed = 0;
  const wallet = {
    getAccounts: async () => [{ accountId: "alice.near" }],
    signMessage: async (payload: { message: string; recipient: string; nonce: Uint8Array }) => {
      assert.equal(payload.message, request.intent.payload.message);
      assert.equal(payload.recipient, request.intent.payload.recipient);
      assert.deepEqual(payload.nonce, new Uint8Array(32).fill(7));
      signed += 1;
      return { accountId: "alice.near", publicKey: request.signer.public_key, signature: "proof" };
    },
  };
  const connector = {
    wallet: async () => wallet,
    getConnectedWallet: async () => ({ wallet, accounts: await wallet.getAccounts() }),
    connect: async () => {
      throw new Error("must not reconnect an available owner wallet");
    },
  } as unknown as OwnerConnector;
  const result = await signIntent(request, async () => connector);
  assert.equal(result.standard, "nep413");
  assert.equal(signed, 1);
});

function walletFixture(
  options: { connected?: string | null; chosen?: string; signed?: string; reject?: boolean } = {},
) {
  const calls = { connect: 0, sign: 0 };
  const chosen = options.chosen ?? "alice.near";
  const wallet = {
    getAccounts: async () => [{ accountId: chosen }],
    signMessage: async (input: { signerId?: string; network?: string }) => {
      calls.sign += 1;
      assert.equal(input.signerId, "alice.near");
      assert.equal(input.network, "mainnet");
      if (options.reject) throw new Error("User rejected");
      return {
        accountId: options.signed ?? chosen,
        publicKey: request.signer.public_key,
        signature: "proof",
      };
    },
  };
  const connector = {
    getConnectedWallet: async () => {
      if (options.connected === null) throw new Error("No accounts found");
      return { wallet, accounts: [{ accountId: options.connected ?? "alice.near" }] };
    },
    connect: async () => {
      calls.connect += 1;
      return wallet;
    },
  } as unknown as OwnerConnector;
  return { calls, connector };
}

test("disconnected owner wallet reconnects during signing without logging out", async () => {
  const { calls, connector } = walletFixture({ connected: null });
  await signIntent(request, async () => connector);
  assert.deepEqual(calls, { connect: 1, sign: 1 });
});

test("a different active wallet can select the owner before signing", async () => {
  const { calls, connector } = walletFixture({ connected: "bob.near" });
  await signIntent(request, async () => connector);
  assert.deepEqual(calls, { connect: 1, sign: 1 });
});

test("choosing a different account refuses the signature without a login reset", async () => {
  const { calls, connector } = walletFixture({ connected: "bob.near", chosen: "bob.near" });
  await assert.rejects(
    signIntent(request, async () => connector),
    /owner_account_mismatch/,
  );
  assert.deepEqual(calls, { connect: 1, sign: 0 });
});

test("account changes inside a wallet prompt cannot return another owner's proof", async () => {
  const { calls, connector } = walletFixture({ signed: "bob.near" });
  await assert.rejects(
    signIntent(request, async () => connector),
    /owner_account_mismatch/,
  );
  assert.deepEqual(calls, { connect: 0, sign: 1 });
});

test("rejected signatures are never automatically retried or reconnected", async () => {
  const { calls, connector } = walletFixture({ reject: true });
  await assert.rejects(
    signIntent(request, async () => connector),
    /User rejected/,
  );
  assert.deepEqual(calls, { connect: 0, sign: 1 });
});

test("NEP-366 keeps the server's delegate payload and pins owner and mainnet", async () => {
  const payload = {
    receiverId: "intents.near",
    actions: [
      {
        type: "FunctionCall" as const,
        params: {
          methodName: "execute",
          args: { proof: "exact" },
          gas: "100000000000000",
          deposit: "0",
        },
      },
    ],
  };
  const wallet = {
    signDelegateActions: async (input: unknown) => {
      assert.deepEqual(input, {
        delegateActions: [payload],
        signerId: "alice.near",
        network: "mainnet",
      });
      return { signedDelegateActions: ["delegate-proof"] };
    },
  };
  const connector = {
    getConnectedWallet: async () => ({ wallet, accounts: [{ accountId: "alice.near" }] }),
  } as unknown as OwnerConnector;
  const result = await signIntent(
    { signer: request.signer, intent: { standard: "nep366", payload } },
    async () => connector,
  );
  assert.deepEqual(result, { standard: "nep366", payload, signed_delegate: "delegate-proof" });
});

test("concurrent owner requests open only one wallet prompt and unlock after completion", async () => {
  const { connector, calls } = walletFixture();
  let release!: (connector: OwnerConnector) => void;
  const gate = new Promise<OwnerConnector>((resolve) => {
    release = resolve;
  });
  const first = signIntent(request, () => gate);
  await assert.rejects(
    signIntent(request, async () => connector),
    /wallet_request_pending/,
  );
  release(connector);
  await first;
  await signIntent(request, async () => connector);
  assert.deepEqual(calls, { connect: 0, sign: 2 });
});
