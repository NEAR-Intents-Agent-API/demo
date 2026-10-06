import { NextResponse } from "next/server";
import { getDemoAuth } from "@/lib/auth/instance";
import { bffError, withSession } from "@/lib/http/handler";

/**
 * `GET /api/mcp/public-client?client_id=…`
 *
 * Reads the public fields of the client asking for consent, so the consent screen can name
 * the harness instead of showing an opaque id. Only fields the provider marks public are
 * returned; a private key or client secret is never part of this endpoint.
 */
export async function GET(request: Request) {
  return withSession(async (_session, log) => {
    const clientId = new URL(request.url).searchParams.get("client_id") ?? "";
    if (!clientId) return bffError("invalid_request", 400, log);
    const url = new URL(request.url);
    const forwarded = new Request(
      `${url.origin}/api/auth/oauth2/public-client?client_id=${encodeURIComponent(clientId)}`,
      {
        method: "GET",
        headers: {
          cookie: request.headers.get("cookie") ?? "",
          origin: url.origin,
        },
      },
    );
    const response = await (await getDemoAuth()).handler(forwarded);
    if (!response.ok) return bffError("client_not_found", 404, log);
    // The session guard above is the demo's; the provider then only returns public fields.
    return NextResponse.json(await response.json());
  }, "GET /api/mcp/public-client");
}
