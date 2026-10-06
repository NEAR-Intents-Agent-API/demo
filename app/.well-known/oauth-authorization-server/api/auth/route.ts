import { getDemoAuth } from "@/lib/auth/instance";

/**
 * RFC 8414 authorization-server metadata for the demo's issuer path.
 *
 * Better Auth serves the same document from inside its handler, but the issuer here is
 * `<origin>/api/auth`, so a harness resolving `/.well-known/oauth-authorization-server`
 * with a path-inserted issuer path reaches this root-level route.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const forwarded = new Request(`${url.origin}/api/auth/.well-known/oauth-authorization-server`, {
    method: "GET",
    headers: request.headers,
  });
  return (await getDemoAuth()).handler(forwarded);
}
