import assert from "node:assert/strict";
import { test } from "node:test";
import { DemoApiError, request } from "../../lib/http/request";

test("malformed successful responses cannot masquerade as an empty successful query", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("upstream HTML", { status: 200 }));
  await assert.rejects(
    request("/api/agents"),
    (error: unknown) => error instanceof DemoApiError && error.code === "invalid_response",
  );
});

test("transport forwards cancellation and preserves it as cancellation", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (_path: RequestInfo | URL, options: RequestInit) => {
    assert.equal(options.signal, controller.signal);
    controller.abort();
    throw new DOMException("Cancelled", "AbortError");
  });
  await assert.rejects(request("/api/agents", { signal: controller.signal }), {
    name: "AbortError",
  });
});

test("failed requests keep server error codes while non-JSON failures get a safe fallback", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: { code: "login_required" } }, { status: 401 }),
  );
  await assert.rejects(
    request("/api/agents"),
    (error: unknown) =>
      error instanceof DemoApiError && error.code === "login_required" && error.status === 401,
  );
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("proxy unavailable", { status: 502 }),
  );
  await assert.rejects(
    request("/api/agents"),
    (error: unknown) =>
      error instanceof DemoApiError && error.code === "request_failed" && error.status === 502,
  );
});
