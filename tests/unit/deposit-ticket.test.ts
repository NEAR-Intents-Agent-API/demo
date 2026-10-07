import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import type { StatusResponse } from "@near-intents-agent-api/sdk";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fundsApi } from "../../features/funds/api";
import { DepositTicket } from "../../features/funds/deposit/deposit-ticket";
import { queryKeys } from "../../lib/query/keys";

test("deposit address renders while observation is still waiting for settlement", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const agentId = "agent-deposit-test";
  const operationId = "op_deposit-test";
  const address = "deposit-address.near";
  const pending: StatusResponse = {
    correlation_id: operationId,
    agent_id: agentId,
    type: "deposit",
    status: "PENDING_DEPOSIT",
    failure_code: null,
    created_at: "2026-10-05T00:00:00.000Z",
    updated_at: "2026-10-05T00:00:00.000Z",
    dispatch_committed_at: "2026-10-05T00:00:00.000Z",
    grant: null,
    details: {
      action: "cross_chain_deposit",
      deposit_address: address,
      memo: "memo-42",
      min_amount: "10000000000000000000000",
    },
  };
  const original = fundsApi.operation;
  let reads = 0;
  const waits: number[] = [];
  let settle: ((status: StatusResponse) => void) | undefined;
  fundsApi.operation = async (_agentId, _operationId, _refresh, _waitMs, signal) => {
    waits.push(_waitMs ?? 0);
    if (++reads === 1) return pending;
    return new Promise((resolve, reject) => {
      settle = resolve;
      signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
        once: true,
      });
    });
  };
  const render = () =>
    renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client },
        createElement(DepositTicket, {
          agentId,
          operationId,
          title: "wNEAR on Near",
          token: { symbol: "wNEAR", decimals: 24 },
          onDone: () => {},
          onOpenActivity: () => {},
        }),
      ),
    );

  let unsubscribe: (() => void) | undefined;
  try {
    render();
    // Mount the query installed by the real component, without a browser or live deposit.
    const query = client
      .getQueryCache()
      .find({ queryKey: queryKeys.operation(agentId, operationId) });
    assert.ok(query);
    const observer = new QueryObserver(client, {
      ...query.options,
      queryKey: queryKeys.operation(agentId, operationId),
    });
    unsubscribe = observer.subscribe(() => {});
    await setImmediate();
    assert.equal(reads, 2, "observation continues after receiving the pending address");
    assert.deepEqual(waits, [0, 25_000], "read the address before starting long-poll observation");
    const markup = render();
    assert.ok(markup.includes(address), "pending deposit must show its funding address");
    assert.ok(markup.includes("Send at least 0.01 wNEAR"), "an open deposit names its minimum");
    assert.ok(markup.includes("memo-42"), "a memo the chain needs is shown with the address");
    assert.ok(settle);
    settle({ ...pending, status: "SUCCESS" });
    await setImmediate();
    assert.equal(reads, 2, "settlement stops observation");
    assert.ok(!render().includes(address), "settled deposit must stop offering its address");
  } finally {
    unsubscribe?.();
    await client.cancelQueries();
    client.clear();
    fundsApi.operation = original;
  }
});
