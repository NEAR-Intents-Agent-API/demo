import { getDemoDatabase } from "@/lib/auth/instance";

export const runtime = "nodejs";

export async function GET() {
  try {
    await getDemoDatabase().checkConnection();
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
