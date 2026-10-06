import { getDemoAuth } from "@/lib/auth/instance";

/** Better Auth catch-all: SIWN, SIWE, passkey and session endpoints. */
export async function GET(request: Request) {
  return (await getDemoAuth()).handler(request);
}

export async function POST(request: Request) {
  return (await getDemoAuth()).handler(request);
}
