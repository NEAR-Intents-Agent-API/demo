export class DemoApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

/** Same-origin BFF transport. Successful malformed responses must not become empty data. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof init?.body === "string" && !headers.has("content-type"))
    headers.set("content-type", "application/json");
  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch((error: unknown) => {
    if (init?.signal?.aborted) throw error;
    if (response.ok) throw new DemoApiError("invalid_response", response.status);
    return null;
  });
  if (!response.ok) {
    const error = body as { code?: unknown; error?: { code?: unknown } } | null;
    const code = error?.error?.code ?? error?.code;
    throw new DemoApiError(typeof code === "string" ? code : "request_failed", response.status);
  }
  return body as T;
}
