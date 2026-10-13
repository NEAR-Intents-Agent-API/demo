import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agentState,
  visibleAgents,
  workspaceSummary,
} from "../../features/agents/model/agent-state";
import { authFailureMessage, walletConnectMessage } from "../../features/auth/errors";
import { identityLabel } from "../../features/auth/identity-label";
import { listOwnedAgents, withFrozenFlag } from "../../lib/agent-api/agent-list";
import { catalogChains, resetCatalogChains } from "../../lib/agent-api/token-chains";

/** Wallet libraries name their errors and EIP-1193 providers attach numeric codes. */
class NamedError extends Error {
  constructor(
    name: string,
    message: string,
    readonly code?: number,
  ) {
    super(message);
    this.name = name;
  }
}

test("a rejected wallet request is classified by name or code, not exact text", () => {
  const declined = /declined/;
  assert.match(
    authFailureMessage(new NamedError("UserRejectedRequestError", "User rejected the request.")),
    declined,
  );
  assert.match(
    authFailureMessage({ code: 4001, message: "MetaMask Message Signature: User denied." }),
    declined,
  );
  assert.match(authFailureMessage(new Error("User rejected the request.")), declined);
  // viem wraps the provider error; the code survives on the cause.
  assert.match(
    authFailureMessage(new Error("Request failed", { cause: { code: 4001 } })),
    declined,
  );
});

test("wallet connection failures get clear text and unknown ones never leak library output", () => {
  assert.match(
    walletConnectMessage(
      new NamedError("ConnectorAlreadyConnectedError", "Connector already connected."),
    ),
    /already connected/,
  );
  assert.match(
    walletConnectMessage(new NamedError("ChainMismatchError", "The current chain...")),
    /network/,
  );
  assert.match(walletConnectMessage({ code: -32002 }), /request open/);
  assert.equal(
    walletConnectMessage(new Error("RPC Error: internal 0xdeadbeef")),
    "Could not connect to the wallet. Try again.",
  );
});

test("passkey failures are not reported as a missing passkey unless that is known", () => {
  const closed = authFailureMessage(new Error("passkey_prompt_closed"));
  assert.match(closed, /cancelled/);
  assert.match(closed, /no passkey for this site/);
  assert.match(
    authFailureMessage(new Error("passkey_registration_cancelled")),
    /Nothing was created/,
  );
  assert.match(authFailureMessage({ code: "PASSKEY_NOT_FOUND" }), /not registered/);
});

test("a cancelled passkey prompt reaches the sign-in code as one ambiguous message", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    if (String(input).includes("generate-authenticate-options"))
      return Response.json({ challenge: "abc", rpId: "localhost", timeout: 1000 });
    throw new Error(`unexpected_request:${String(input)}`);
  };
  try {
    const { passkeyLogin } = await import("../../features/auth/providers.js");
    await assert.rejects(
      passkeyLogin(),
      (error: Error) => error.message === "passkey_prompt_closed",
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("the header shows the signed-in identity, elided in the middle when long", () => {
  const near = identityLabel({
    name: "x",
    email: "x",
    ownerType: "near",
    ownerLabel: "alice.near",
  });
  assert.deepEqual(near, { short: "alice.near", full: "alice.near" });
  const implicit = "a".repeat(64);
  const long = identityLabel({ name: "x", email: "x", ownerType: "near", ownerLabel: implicit });
  assert.equal(long.full, implicit);
  assert.match(long.short, /^a{10}…a{8}$/);
  const address = `0x${"ab".repeat(20)}`;
  const evm = identityLabel({ name: "x", email: "x", ownerType: "evm", ownerLabel: address });
  assert.equal(evm.short, "0xabab…abab");
  assert.equal(evm.full, address);
  const passkey = identityLabel({
    name: "Passkey 1a2b3c4d",
    email: "x",
    ownerType: "passkey",
    ownerLabel: "cred123",
  });
  assert.deepEqual(passkey, { short: "Passkey 1a2b3c4d", full: "Passkey 1a2b3c4d" });
});

const view = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "a".repeat(64),
    name: "agent",
    external_user_id: "user-1",
    status: "ACTIVE",
    deleted: false,
    archived: false,
    owner: null,
    owner_account: null,
    wallet: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }) as never;

test("a frozen account is shown and counted as frozen, never as live", () => {
  const frozen = agentState(view({ frozen: true }));
  assert.equal(frozen.stage, "frozen");
  assert.equal(frozen.label, "Frozen");
  assert.equal(agentState(view({ frozen: false })).stage, "ready");
  const summary = workspaceSummary([
    view({ frozen: false }),
    view({ frozen: true }),
    view({ frozen: null }),
    view({ status: "PENDING" }),
    view({ status: "ARCHIVED" }),
    view({ status: "DELETED" }),
  ]);
  assert.deepEqual(summary, { total: 5, operational: 1, frozen: 1, unknown: 1, needsYou: 1 });
});

test("an account whose frozen state is unknown is neither operational nor frozen", () => {
  const unknown = agentState(view({ frozen: null }));
  assert.equal(unknown.stage, "active");
  assert.equal(unknown.label, "Active");
});

test("the listed accounts and the counters are the same set", () => {
  const agents = [
    view(),
    view({ status: "ARCHIVED" }),
    view({ status: "DELETED" }),
    view({ status: "ABANDONED" }),
  ];
  assert.equal(visibleAgents(agents).length, workspaceSummary(agents).total);
  assert.equal(agentState(view({ status: "ARCHIVED" })).label, "Archived");
});

test("the account list follows every page and keeps only the owner's", async () => {
  const pages: Record<string, { data: unknown[]; next_cursor: string | null }> = {
    first: {
      data: [view({ id: "1" }), view({ id: "other", external_user_id: "user-2" })],
      next_cursor: "second",
    },
    second: { data: [view({ id: "2", status: "PENDING" }), view({ id: "3" })], next_cursor: null },
  };
  let inFlight = 0;
  let peak = 0;
  const policyReads: string[] = [];
  const api = {
    listAgents: async (query?: { cursor?: string }) => pages[query?.cursor ?? "first"] as never,
    getPolicy: async (id: string) => {
      policyReads.push(id);
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return { status: "APPLIED", policy: { frozen: id === "3" } } as never;
    },
  };
  const plain = await listOwnedAgents(api, "user-1");
  assert.deepEqual(
    plain.map((agent) => [agent.id, agent.frozen]),
    [
      ["1", null],
      ["2", false],
      ["3", null],
    ],
  );
  assert.deepEqual(policyReads, [], "the plain list reads no policies");
  const list = await listOwnedAgents(api, "user-1", { frozen: true });
  assert.deepEqual(
    list.map((agent) => [agent.id, agent.frozen]),
    [
      ["1", false],
      ["2", false],
      ["3", true],
    ],
  );
  assert.deepEqual(policyReads.sort(), ["1", "3"], "only active accounts can be frozen");
  assert.ok(peak <= 8);
});

test("the frozen flag comes only from an applied policy and a failed read leaves it unknown", async () => {
  const account = view({ id: "1" });
  const read = (result: unknown) => ({
    getPolicy: async () => {
      if (result instanceof Error) throw result;
      return result as never;
    },
  });
  assert.equal(
    (await withFrozenFlag(read({ status: "APPLIED", policy: { frozen: true } }), account)).frozen,
    true,
  );
  for (const status of ["SIGNED", "FAILED"])
    assert.equal(
      (await withFrozenFlag(read({ status, policy: { frozen: true } }), account)).frozen,
      null,
      status,
    );
  assert.equal(
    (await withFrozenFlag(read({ status: "APPLIED", policy: null }), account)).frozen,
    null,
  );
  assert.equal((await withFrozenFlag(read(new Error("policy_unavailable")), account)).frozen, null);
  // One failing account does not fail the list.
  const list = await listOwnedAgents(
    {
      listAgents: async () => ({ data: [account], next_cursor: null }) as never,
      getPolicy: read(new Error("policy_unavailable")).getPolicy,
    },
    "user-1",
    { frozen: true },
  );
  assert.deepEqual(
    list.map((agent) => agent.frozen),
    [null],
  );
});

test("the sign-in page reads networks from the public token list and survives its failure", async () => {
  resetCatalogChains();
  const tokens = [{ blockchain: "eth" }, { blockchain: "eth" }, { blockchain: "sol" }];
  let calls = 0;
  const api = {
    getTokens: async () => {
      calls += 1;
      return tokens as never;
    },
  };
  assert.deepEqual(await catalogChains(api, 1_000), ["eth", "sol"]);
  assert.deepEqual(await catalogChains(api, 2_000), ["eth", "sol"]);
  assert.equal(calls, 1, "served from the cache");
  const failing = {
    getTokens: async () => {
      throw new Error("down");
    },
  };
  assert.deepEqual(await catalogChains(failing, 1_000_000), ["eth", "sol"], "stale answer is kept");
  resetCatalogChains();
  assert.equal(await catalogChains(failing, 1_000_000), null);
});
