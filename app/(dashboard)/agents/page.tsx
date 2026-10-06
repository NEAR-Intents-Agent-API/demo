import { redirect } from "next/navigation";
import { AgentsPage } from "@/features/agents/index";

export default async function AgentsRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = await searchParams;
  if (search.create === "1") redirect("/agents/new");
  return <AgentsPage />;
}
