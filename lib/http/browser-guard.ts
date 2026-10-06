/**
 * Browser-mutation guard for the demo BFF.
 *
 * The session cookie is `SameSite=Lax`, which reduces ordinary cross-site form posts but is not
 * an authorization control: an untrusted sibling origin on the same site, a `text/plain` body
 * that reaches `request.json()`, or a missing `Origin` all bypass it. Mutations therefore run
 * through one guard that checks the exact public request origin, the browser's own fetch metadata,
 * a bounded JSON content type, and a bounded body.
 */

const defaultBodyLimitBytes = 64 * 1024;
const defaultBodyReadTimeoutMs = 30_000;
// At defaults, active readers reserve at most 4 MiB of body buffers per process.
const maxActiveBodyReadsPerProcess = 64;
const maxAggregateBodyBufferBytes = defaultBodyLimitBytes * maxActiveBodyReadsPerProcess;
let activeBodyReads = 0;
let activeBodyBufferBytes = 0;

export type BrowserGuardFailure = { ok: false; reason: "origin_not_allowed" | "body_too_large" };

export type BrowserGuard = { ok: true; request: Request };

/** One public origin for the dashboard, auth and MCP. Proxy must overwrite forwarding headers. */
function allowedOrigins(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  if (!host || /[,\s/\\]/.test(host)) return new Set<string>();
  const target = new URL(`https://${host}`);
  if (["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) target.protocol = "http:";
  return new Set([target.origin]);
}

function sameOrigin(value: string | null, origins: Set<string>) {
  if (!value) return false;
  try {
    return origins.has(new URL(value).origin);
  } catch {
    return false;
  }
}

/**
 * Rejects a mutating request unless it can only have come from the demo's own page. `Origin` is
 * required: a null or absent origin on a state-changing request is treated as hostile rather
 * than as a legacy browser. `Sec-Fetch-Site` is checked when the browser supplies it.
 */
export function guardBrowserMutation(
  request: Request,
  options: { maxBytes?: number } = {},
): BrowserGuardFailure | BrowserGuard {
  const origins = allowedOrigins(request);
  if (!sameOrigin(request.headers.get("origin"), origins))
    return { ok: false, reason: "origin_not_allowed" };
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")
    return { ok: false, reason: "origin_not_allowed" };
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json"))
    return { ok: false, reason: "origin_not_allowed" };
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > (options.maxBytes ?? defaultBodyLimitBytes)
  )
    return { ok: false, reason: "body_too_large" };
  return { ok: true, request };
}

function reserveBodyRead(body: ReadableStream<Uint8Array>, limit: number) {
  if (
    activeBodyReads >= maxActiveBodyReadsPerProcess ||
    limit > maxAggregateBodyBufferBytes - activeBodyBufferBytes
  ) {
    void body.cancel().catch(() => {});
    return undefined;
  }

  activeBodyReads += 1;
  activeBodyBufferBytes += limit;
  let reserved = true;
  return () => {
    if (!reserved) return;
    reserved = false;
    activeBodyReads -= 1;
    activeBodyBufferBytes -= limit;
  };
}

function parseGuardedJson(bodyBuffer: Uint8Array | undefined, totalBytes: number) {
  if (!bodyBuffer) return undefined;
  try {
    return JSON.parse(new TextDecoder().decode(bodyBuffer.subarray(0, totalBytes)));
  } catch {
    return undefined;
  }
}

/**
 * Reads a JSON body through the guard. Content type and the declared length were checked by the
 * caller; the body is copied into a fixed-size buffer and capped as chunks arrive, because
 * `content-length` is advisory. Oversized and stalled streams are cancelled.
 */
export async function readGuardedJson(
  request: Request,
  options: { maxBytes?: number; timeoutMs?: number } = {},
): Promise<unknown> {
  const limit = options.maxBytes ?? defaultBodyLimitBytes;
  const timeoutMs = options.timeoutMs ?? defaultBodyReadTimeoutMs;
  if (
    !Number.isSafeInteger(limit) ||
    limit < 0 ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 0
  )
    return undefined;
  const body = request.body;
  if (!body) return undefined;
  const releaseBodyReadBudget = reserveBodyRead(body, limit);
  if (!releaseBodyReadBudget) return undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let releaseAfterRead = true;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let bodyBuffer: Uint8Array | undefined;
  const releaseReader = () => {
    try {
      reader?.releaseLock();
    } catch {
      // A timed-out read releases its lock after cancellation resolves the pending read.
    }
  };

  try {
    const bodyReader = body.getReader();
    reader = bodyReader;
    bodyBuffer = new Uint8Array(limit);
    const timedOut = Symbol("body_read_timeout");
    const timeout = new Promise<typeof timedOut>((resolve) => {
      timeoutHandle = setTimeout(() => resolve(timedOut), timeoutMs);
    });
    let totalBytes = 0;
    while (true) {
      const pendingRead = bodyReader.read();
      const result = await Promise.race([pendingRead, timeout]);
      if (result === timedOut) {
        bodyBuffer = undefined;
        void bodyReader.cancel().catch(() => {});
        releaseAfterRead = false;
        void pendingRead.then(
          () => {
            releaseReader();
            releaseBodyReadBudget();
          },
          () => {
            releaseReader();
            releaseBodyReadBudget();
          },
        );
        return undefined;
      }
      if (result.done) break;
      if (totalBytes + result.value.byteLength > limit) {
        bodyBuffer = undefined;
        void bodyReader.cancel().catch(() => {});
        return undefined;
      }
      bodyBuffer.set(result.value, totalBytes);
      totalBytes += result.value.byteLength;
    }

    return parseGuardedJson(bodyBuffer, totalBytes);
  } finally {
    clearTimeout(timeoutHandle);
    if (releaseAfterRead) {
      releaseReader();
      releaseBodyReadBudget();
    }
  }
}
