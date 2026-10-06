import { NextResponse } from "next/server";
import { demoOwnerForSession } from "@/lib/auth/owner-session";
import { currentSession } from "@/lib/auth/session";

/**
 * `GET /api/auth/session`
 *
 * The browser reads its active owner identity from here. The response contains only public
 * identity metadata: no Agent API key, no session token, no private credential material.
 */
export async function GET() {
  const session = await currentSession();
  if (!session)
    return NextResponse.json(
      { session: null },
      { headers: { "cache-control": "private, no-store" } },
    );
  const owner = await demoOwnerForSession(session);
  return NextResponse.json(
    { session: { userId: session.userId, name: session.name, email: session.email, owner } },
    { headers: { "cache-control": "private, no-store" } },
  );
}
