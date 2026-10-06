"use client";

import { useRouter } from "next/navigation";
import { useCreateAgent } from "./use-create-agent";

export function useCreateAccountDialog() {
  const router = useRouter();
  const view = useCreateAgent();
  const close = () => {
    if (view.create.isPending) return;
    const accountId = view.create.data?.generated.agent_id ?? view.pendingAgentId;
    router.replace(accountId ? `/agents/${encodeURIComponent(accountId)}` : "/agents");
  };
  return { view, close };
}
