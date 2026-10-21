import assert from "node:assert/strict";
import { test } from "node:test";
import { AgentApiError } from "@near-intents-agent-api/sdk";
import { agentApiErrorDetails, errorDetails } from "../../lib/http/error-details";
import { bffError } from "../../lib/http/errors";
import { DemoApiError, request } from "../../lib/http/request";

test("only well-formed allowlisted fields survive", () => {
  assert.deepEqual(
    errorDetails({
      available_at: "2026-10-13T14:32:00.000Z",
      budget_remaining_usd: "1.50",
      detail: "Send the same request again under the Idempotency-Key",
      token: "secret",
      provider_message: "raw provider text",
    }),
    { available_at: "2026-10-13T14:32:00.000Z", budget_remaining_usd: "1.50" },
  );
  assert.deepEqual(errorDetails({ available_at: "tomorrow", budget_remaining_usd: "lots" }), {});
  assert.deepEqual(errorDetails({ available_at: 123, budget_remaining_usd: 4 }), {});
  assert.deepEqual(errorDetails(null), {});
  assert.deepEqual(errorDetails("available_at"), {});
});

test("min_amount is forwarded only as a whole number of atomic units", () => {
  assert.deepEqual(errorDetails({ min_amount: "1000000" }), { min_amount: "1000000" });
  assert.deepEqual(errorDetails({ min_amount: "0" }), { min_amount: "0" });
  assert.deepEqual(errorDetails({ min_amount: "9".repeat(78) }), { min_amount: "9".repeat(78) });
  for (const malformed of ["1.5", "", "-1", "1e6", " 10", "9".repeat(79), 10, null, undefined])
    assert.deepEqual(errorDetails({ min_amount: malformed }), {}, String(malformed));
});

test("only the pointer shapes the API names on mismatches are forwarded", () => {
  const kept = [
    "/signed_data/payload/message/tenant_id",
    "/signed_data/payload/message/agent_id",
    "/signed_data/payload/message/network",
    "/signed_data/payload/message/recipient",
    "/signed_data/payload/message/account_id",
    "/signed_data/payload/message/public_key",
    "/signed_data/payload/message/previous_public_key",
    "/signed_data/payload/message/owner",
    "/signed_data/public_key",
    "/signed_data/credential/id",
    "/signed_data/signed_delegate/sender_id",
    "/signed_data/signed_delegate/public_key",
    "/signed_data/signed_delegate/receiver_id",
    "/signed_data/signed_delegate/actions",
    "/signed_data/signed_delegate/actions/0/receiver_id",
    "/signed_data/signed_delegate/actions/12/method_name",
    "/signed_data/signed_delegate/actions/0/deposit",
    "/signed_data/signed_delegate/actions/0/gas",
    "/signed_data/signed_delegate/actions/0/args",
  ];
  for (const pointer of kept) assert.deepEqual(errorDetails({ pointer }), { pointer }, pointer);
  const dropped = [
    "/label",
    "/signed_data",
    "/signed_data/payload/message/label",
    "/signed_data/payload/message/network/x",
    "/signed_data/payload/message/network ",
    "signed_data/public_key",
    "/signed_data/signed_delegate/actions/x/gas",
    "/signed_data/signed_delegate/actions/1234/gas",
    "/signed_data/signed_delegate/actions/0/args/0",
    "/signed_data/credential/id\nsecret",
    "/SIGNED_DATA/PUBLIC_KEY",
  ];
  for (const pointer of dropped) assert.deepEqual(errorDetails({ pointer }), {}, pointer);
  assert.deepEqual(errorDetails({ pointer: 7 }), {});
  assert.deepEqual(errorDetails({ source: { pointer: "/signed_data/public_key" } }), {});
});

test("an Agent API refusal hands over its pointer and retry time, never its detail", () => {
  const refusal = (source?: { pointer: string }) =>
    new AgentApiError(409, {
      errors: [
        {
          status: "409",
          code: "owner_mismatch",
          title: "Owner mismatch",
          detail: "The message was signed for testnet; this agent is on mainnet.",
          ...(source ? { source } : {}),
          meta: { retryable: false, available_at: "2026-10-13T14:32:00.000Z" },
        },
      ],
      meta: { request_id: "r" },
    });
  assert.deepEqual(
    agentApiErrorDetails(refusal({ pointer: "/signed_data/payload/message/network" })),
    {
      available_at: "2026-10-13T14:32:00.000Z",
      pointer: "/signed_data/payload/message/network",
    },
  );
  assert.deepEqual(agentApiErrorDetails(refusal({ pointer: "/label" })), {
    available_at: "2026-10-13T14:32:00.000Z",
  });
  assert.deepEqual(agentApiErrorDetails(refusal()), { available_at: "2026-10-13T14:32:00.000Z" });
});

test("an amount_too_low refusal hands over the route minimum when it is well-formed", () => {
  const refusal = (min_amount: unknown) =>
    new AgentApiError(422, {
      errors: [
        {
          status: "422",
          code: "amount_too_low",
          title: "Amount too low",
          detail: "Below the route minimum.",
          meta: { retryable: false, min_amount } as never,
        },
      ],
      meta: { request_id: "r" },
    });
  assert.deepEqual(agentApiErrorDetails(refusal("1000000")), { min_amount: "1000000" });
  assert.deepEqual(agentApiErrorDetails(refusal("1.5")), {});
  assert.deepEqual(agentApiErrorDetails(refusal("")), {});
  assert.deepEqual(agentApiErrorDetails(refusal(1000000)), {});
  assert.deepEqual(agentApiErrorDetails(refusal(undefined)), {});
});

test("the BFF error body carries the allowlisted details and nothing else", async () => {
  const response = bffError("policy_change_throttled", 429, {}, {
    available_at: "2026-10-13T14:32:00.000Z",
    leaked: "secret",
  } as never);
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), {
    error: { code: "policy_change_throttled", available_at: "2026-10-13T14:32:00.000Z" },
  });
  assert.deepEqual(await bffError("wallet_busy").json(), { error: { code: "wallet_busy" } });
  const mismatch = bffError("owner_mismatch", 409, {}, {
    pointer: "/signed_data/payload/message/network",
    detail: "The message was signed for testnet; this agent is on mainnet.",
  } as never);
  assert.deepEqual(await mismatch.json(), {
    error: { code: "owner_mismatch", pointer: "/signed_data/payload/message/network" },
  });
});

test("the transport hands the details to DemoApiError", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(
      {
        error: {
          code: "agent_unfreeze_throttled",
          available_at: "2026-10-13T14:32:00.000Z",
          provider_message: "ignored",
        },
      },
      { status: 429 },
    ),
  );
  await assert.rejects(
    request("/api/agents/a/freeze"),
    (error: unknown) =>
      error instanceof DemoApiError &&
      error.code === "agent_unfreeze_throttled" &&
      error.status === 429 &&
      JSON.stringify(error.details) === '{"available_at":"2026-10-13T14:32:00.000Z"}',
  );
});

test("the transport keeps an allowlisted pointer on DemoApiError", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(
      { error: { code: "signer_mismatch", pointer: "/signed_data/credential/id" } },
      { status: 403 },
    ),
  );
  await assert.rejects(
    request("/api/agents/a/policy"),
    (error: unknown) =>
      error instanceof DemoApiError && error.details.pointer === "/signed_data/credential/id",
  );
});

test("a network failure becomes a named code, but an abort stays an abort", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    request("/api/agents"),
    (error: unknown) => error instanceof DemoApiError && error.code === "network_unreachable",
  );
});
