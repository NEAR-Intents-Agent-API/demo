import assert from "node:assert/strict";
import { test } from "node:test";
import { errorDetails } from "../../lib/http/error-details";
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

test("a network failure becomes a named code, but an abort stays an abort", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    request("/api/agents"),
    (error: unknown) => error instanceof DemoApiError && error.code === "network_unreachable",
  );
});
