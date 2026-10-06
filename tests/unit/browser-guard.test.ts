import assert from "node:assert/strict";
import { test } from "node:test";

const { guardBrowserMutation, readGuardedJson } = await import("../../lib/http/browser-guard");

function streamingRequest(url: string, init: RequestInit & { duplex: "half" }) {
  return new Request(url, init);
}

function mutation(input: {
  origin?: string | null;
  fetchSite?: string | null;
  contentType?: string;
  body?: string;
}) {
  const headers = new Headers();
  if (input.origin !== null && input.origin !== undefined) headers.set("origin", input.origin);
  if (input.fetchSite) headers.set("sec-fetch-site", input.fetchSite);
  headers.set("content-type", input.contentType ?? "application/json");
  return new Request("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers,
    body: input.body ?? "{}",
  });
}

test("a same-origin JSON mutation passes the browser guard", () => {
  const result = guardBrowserMutation(mutation({ origin: "https://demo.example.test" }));
  assert.equal(result.ok, true);
});

test("cross-origin, missing-origin and non-JSON mutations are rejected", () => {
  // A hostile page on a different origin.
  assert.deepEqual(guardBrowserMutation(mutation({ origin: "https://evil.example" })), {
    ok: false,
    reason: "origin_not_allowed",
  });
  // A missing Origin is treated as hostile rather than as a legacy browser.
  assert.deepEqual(guardBrowserMutation(mutation({ origin: null })), {
    ok: false,
    reason: "origin_not_allowed",
  });
  // `text/plain` is a CORS-simple content type; it must not reach `request.json()`.
  assert.deepEqual(
    guardBrowserMutation(
      mutation({ origin: "https://demo.example.test", contentType: "text/plain" }),
    ),
    { ok: false, reason: "origin_not_allowed" },
  );
});

test("cross-site and sibling-site requests are rejected even from an allowed origin", () => {
  assert.deepEqual(
    guardBrowserMutation(
      mutation({ origin: "https://demo.example.test", fetchSite: "cross-site" }),
    ),
    { ok: false, reason: "origin_not_allowed" },
  );
  assert.deepEqual(
    guardBrowserMutation(mutation({ origin: "https://demo.example.test", fetchSite: "same-site" })),
    { ok: false, reason: "origin_not_allowed" },
  );
  // A direct navigation or same-origin fetch is allowed.
  assert.equal(
    guardBrowserMutation(
      mutation({ origin: "https://demo.example.test", fetchSite: "same-origin" }),
    ).ok,
    true,
  );
});

test("a declared oversized body is rejected before it is read", async () => {
  const headers = new Headers({
    origin: "https://demo.example.test",
    "content-type": "application/json",
    "content-length": String(1024 * 1024),
  });
  const request = new Request("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers,
    body: "{}",
  });
  assert.deepEqual(guardBrowserMutation(request), { ok: false, reason: "body_too_large" });
});

test("reading a guarded JSON body caps undeclared size and rejects malformed input", async () => {
  const oversized = new Request("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ padding: "x".repeat(2048) }),
  });
  assert.equal(await readGuardedJson(oversized, { maxBytes: 128 }), undefined);

  const malformedLength = new Request("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers: {
      origin: "https://demo.example.test",
      "content-type": "application/json",
      "content-length": "not-a-number",
    },
    body: JSON.stringify({ padding: "x".repeat(2048) }),
  });
  assert.equal(guardBrowserMutation(malformedLength).ok, true);
  assert.equal(await readGuardedJson(malformedLength, { maxBytes: 128 }), undefined);

  const malformed = new Request("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  assert.equal(await readGuardedJson(malformed), undefined);

  const valid = new Request("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "codex" }),
  });
  assert.deepEqual(await readGuardedJson(valid), { name: "codex" });
});

test("a short declared length cannot bypass the streaming byte cap", async () => {
  const encoder = new TextEncoder();
  let emittedChunks = 0;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        if (emittedChunks === 0) {
          emittedChunks += 1;
          controller.enqueue(encoder.encode('{"v":"abcde'));
          return;
        }
        if (emittedChunks === 1) {
          emittedChunks += 1;
          controller.enqueue(encoder.encode("é"));
          return;
        }
        emittedChunks += 1;
        controller.enqueue(encoder.encode('"}'));
        controller.close();
      },
      cancel() {
        cancelled = true;
      },
    },
    { highWaterMark: 0 },
  );
  const request = streamingRequest("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers: {
      origin: "https://demo.example.test",
      "content-type": "application/json",
      "content-length": "1",
    },
    body,
    duplex: "half",
  });

  assert.equal(guardBrowserMutation(request).ok, true);
  assert.equal(await readGuardedJson(request, { maxBytes: 12 }), undefined);
  assert.equal(cancelled, true);
  assert.equal(emittedChunks, 2);
});

test("a stalled body read is cancelled at its deadline", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    cancel() {
      cancelled = true;
      return new Promise<void>(() => {});
    },
  });
  const request = streamingRequest("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half",
  });

  assert.equal(await readGuardedJson(request, { timeoutMs: 5 }), undefined);
  assert.equal(cancelled, true);
});

test("concurrent stalled reads stay within the per-process reader budget", async () => {
  const readerLimit = 64;
  const controllers: ReadableStreamDefaultController<Uint8Array>[] = [];
  let cancelledBodies = 0;
  const stalledRequest = () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controllers.push(controller);
      },
      cancel() {
        cancelledBodies += 1;
      },
    });
    return streamingRequest("https://demo.example.test/api/mcp/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      duplex: "half",
    });
  };

  const pendingReads = Array.from({ length: readerLimit }, () =>
    readGuardedJson(stalledRequest(), { timeoutMs: 5_000 }),
  );
  assert.equal(controllers.length, readerLimit);
  const overflow = await readGuardedJson(stalledRequest(), { timeoutMs: 5_000 });
  assert.equal(overflow, undefined);
  assert.equal(cancelledBodies, 1);

  for (const controller of controllers.slice(0, readerLimit)) controller.close();
  assert.deepEqual(await Promise.all(pendingReads), Array(readerLimit).fill(undefined));

  const recovered = new Request("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ recovered: true }),
  });
  assert.deepEqual(await readGuardedJson(recovered), { recovered: true });
});

test("a custom body limit cannot exceed the aggregate buffer budget", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    cancel() {
      cancelled = true;
    },
  });
  const request = streamingRequest("https://demo.example.test/api/mcp/connections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half",
  });

  assert.equal(await readGuardedJson(request, { maxBytes: 64 * 1024 * 64 + 1 }), undefined);
  assert.equal(cancelled, true);
});

test("proxy host defines the trusted origin; the caller Origin cannot redefine it", () => {
  const request = (origin: string) =>
    new Request("http://internal:3001/api/agents", {
      method: "POST",
      headers: {
        "x-forwarded-host": "demo.example.test",
        origin,
        "content-type": "application/json",
      },
      body: "{}",
    });
  assert.equal(guardBrowserMutation(request("https://demo.example.test")).ok, true);
  assert.equal(guardBrowserMutation(request("https://sibling.example.test")).ok, false);
});
