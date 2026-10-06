import { redirect } from "next/navigation";
import { CatalogProvider } from "@/features/assets";
import { ConsentDenied, ConsentPanel } from "@/features/mcp/index";
import { currentSession } from "@/lib/auth/session";
import { agentIdFromResource } from "@/lib/mcp/config";

/** Better Auth supplies signed consent state; owner grants bind each client to one agent. */
export const dynamic = "force-dynamic";

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await currentSession();
  const params = await searchParams;
  const oauthQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value))
      value.forEach((entry) => {
        oauthQuery.append(key, entry);
      });
    else if (value !== undefined) oauthQuery.set(key, value);
  }
  if (!session) {
    // Preserve the full request so login can resume it.
    redirect(`/login?${oauthQuery.toString()}`);
  }
  const agentId = await agentIdFromResource(oauthQuery.get("resource"));
  if (!agentId)
    return (
      <ConsentDenied
        title="Unknown resource"
        detail="This authorization request is not for an agent account on this dashboard."
      />
    );
  return (
    <CatalogProvider>
      <ConsentPanel
        agentId={agentId}
        clientId={oauthQuery.get("client_id") ?? ""}
        scope={oauthQuery.get("scope") ?? ""}
        oauthQuery={oauthQuery.toString()}
      />
    </CatalogProvider>
  );
}
