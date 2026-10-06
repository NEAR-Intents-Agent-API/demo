import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/keys";
import { refreshAgentQueries } from "../../lib/query/refresh-agent";

test("account refresh updates cached facts while leaving other accounts and money drafts alone", async () => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const account = "sample";
  const facts = [
    queryKeys.agent(account),
    queryKeys.balances(account, "public"),
    queryKeys.balances(account, "confidential"),
    queryKeys.access(account),
    queryKeys.grants(account),
    queryKeys.policy(account),
    queryKeys.controls(account),
    queryKeys.scheduled(account),
    queryKeys.operations(account),
    queryKeys.approvals(account),
    queryKeys.mcp(account),
    queryKeys.catalog(),
  ];
  const untouched = [
    queryKeys.agent("other"),
    queryKeys.balances("other", "public"),
    queryKeys.mcp("other"),
    queryKeys.swapQuote(account, { amount: "1" }),
    queryKeys.withdrawPreview(account, { amount: "1" }),
    queryKeys.onboarding(account),
    queryKeys.workflow(account),
  ];
  const reads: string[] = [];
  try {
    await Promise.all(
      [...facts, ...untouched].map((queryKey) =>
        cache.fetchQuery({
          queryKey,
          staleTime: Infinity,
          queryFn: async () => {
            reads.push(JSON.stringify(queryKey));
            return "data";
          },
        }),
      ),
    );
    reads.length = 0;
    await refreshAgentQueries(cache, account);
    assert.equal(reads.length, facts.length);
    assert.deepEqual(new Set(reads), new Set(facts.map((key) => JSON.stringify(key))));
    assert.ok(untouched.every((key) => cache.getQueryState(key)?.isInvalidated === false));
  } finally {
    cache.clear();
  }
});
