import { authOrigin } from "@/lib/auth/authority";
import { getDemoAuth } from "@/lib/auth/instance";
import { demoEnv } from "@/lib/config/runtime";

/**
 * `POST /api/auth/sign-out`
 *
 * Delegates to Better Auth so the session row is deleted server-side and the browser cookie
 * is cleared. A previously captured cookie is unusable afterwards.
 */
export async function POST(request: Request) {
  const config = await demoEnv();
  const base = config.BETTER_AUTH_URL.replace(/\/$/, "");
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  // Same-origin browser fetch always sends Origin; synthesize it only when absent so
  // Better Auth's origin check still sees the trusted demo origin.
  if (!headers.get("origin")) headers.set("origin", authOrigin(config));
  return (await getDemoAuth()).handler(
    new Request(`${base}/api/auth/sign-out`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    }),
  );
}
