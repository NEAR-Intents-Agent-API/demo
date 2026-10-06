import { CreateAgentPage } from "@/features/agents/index";
import { requireSession } from "@/lib/auth/session";

export default async function CreateAgentRoute() {
  await requireSession();
  return <CreateAgentPage />;
}
