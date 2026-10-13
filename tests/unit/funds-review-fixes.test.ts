import assert from "node:assert/strict";
import { test } from "node:test";
import { AgentApiError } from "@near-intents-agent-api/sdk";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FlowError } from "../../features/funds/flows/flow-error";
import { cancellationCode } from "../../features/wallet/cancellation";
import { catalogChains, resetCatalogChains } from "../../lib/agent-api/token-chains";
import { errorMessage } from "../../lib/http/messages";
import { DemoApiError } from "../../lib/http/request";
import { isLoggedRefusal } from "../../lib/mcp/activity";
import { ToolDeniedError } from "../../lib/mcp/tools";

function render(error: unknown): string {
  return renderToStaticMarkup(createElement(FlowError, { error }));
}

test("a money flow shows the budget left and the retry time from the error's details", () => {
  const budget = new DemoApiError("spend_budget_exceeded", 403, { budget_remaining_usd: "2.5" });
  assert.match(render(budget), /\$2\.50 left/);
  const retryAt = new Date(Date.now() + 10 * 60_000).toISOString();
  const schedule = new DemoApiError("policy_schedule_denied", 403, { available_at: retryAt });
  assert.match(render(schedule), /Try again after \d\d:\d\d/);
  assert.equal(render(null), "");
  assert.equal(render(undefined), "");
});

test("a budget below one cent reads as less than a cent, never $0.00", () => {
  const message = errorMessage(
    new DemoApiError("spend_budget_exceeded", 403, { budget_remaining_usd: "0.004" }),
  );
  assert.match(message, /less than \$0\.01 left/);
  assert.doesNotMatch(message, /\$0\.00/);
  assert.match(
    errorMessage(new DemoApiError("spend_budget_exceeded", 403, { budget_remaining_usd: "0" })),
    /\$0\.00 left/,
  );
});

test("a closed passkey prompt names cancel, timeout and a missing passkey", () => {
  const notAllowed = Object.assign(new Error("timed out"), { name: "NotAllowedError" });
  assert.equal(cancellationCode(notAllowed, "webauthn"), "passkey_prompt_closed");
  assert.match(
    errorMessage("passkey_prompt_closed"),
    /cancelled, timed out, or this device has no passkey/,
  );
  assert.equal(cancellationCode(new Error("User rejected"), "nep413"), "wallet_request_cancelled");
  assert.equal(cancellationCode(new Error("User rejected"), "eip712"), "wallet_request_cancelled");
  assert.equal(cancellationCode(new Error("owner_account_mismatch"), "webauthn"), null);
});

test("a rules change still settling has its own message", () => {
  assert.match(errorMessage(new DemoApiError("policy_change_in_flight", 409)), /still settling/);
});

test("only policy and validation refusals are logged on the activity feed", () => {
  const refusal = (status: number) =>
    new AgentApiError(status, {
      errors: [{ status: String(status), code: "x", title: "x" }],
      meta: { request_id: "r" },
    } as never);
  assert.equal(isLoggedRefusal(refusal(403)), true);
  assert.equal(isLoggedRefusal(refusal(400)), true);
  assert.equal(isLoggedRefusal(new ToolDeniedError("policy_destination_denied")), true);
  assert.equal(isLoggedRefusal(refusal(429)), false);
  assert.equal(isLoggedRefusal(refusal(503)), false);
  assert.equal(isLoggedRefusal(refusal(500)), false);
  assert.equal(isLoggedRefusal(new TypeError("fetch failed")), false);
});

test("the sign-in catalogue read is shared while in flight and a failure is cached briefly", async () => {
  resetCatalogChains();
  let calls = 0;
  let release = () => {};
  const slow = {
    getTokens: async () => {
      calls += 1;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      throw new Error("down");
    },
  };
  const first = catalogChains(slow, 1_000);
  const second = catalogChains(slow, 1_000);
  release();
  assert.equal(await first, null);
  assert.equal(await second, null);
  assert.equal(calls, 1, "concurrent renders share one read");
  assert.equal(await catalogChains(slow, 1_000 + 29_000), null);
  assert.equal(calls, 1, "a failure is not retried inside 30 s");
  const healthy = { getTokens: async () => [{ blockchain: "eth" }] as never };
  assert.deepEqual(await catalogChains(healthy, 1_000 + 31_000), ["eth"]);
  resetCatalogChains();
});
