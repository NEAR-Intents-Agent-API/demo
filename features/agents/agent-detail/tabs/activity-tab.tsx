"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperationsPanel } from "@/features/funds";
import { AgentMcpActivity } from "@/features/mcp/index";
import { ApprovalsPanel } from "@/features/wallet/index";

/** Decisions stay visible; history is separated by the kind of request. */
export function ActivityTab({ agent }: { agent: AgentView }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ApprovalsPanel agentId={agent.id} />
      <Tabs defaultValue="operations" className="min-w-0 gap-3">
        <div className="flex justify-end">
          <TabsList className="grid w-full grid-cols-2 sm:w-fit">
            <TabsTrigger value="operations" className="px-3 text-xs">
              Wallet operations
            </TabsTrigger>
            <TabsTrigger value="clients" className="px-3 text-xs">
              Client requests
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="operations"
          className="min-w-0 overflow-hidden rounded-lg border bg-card"
        >
          <OperationsPanel agent={agent} />
        </TabsContent>
        <TabsContent value="clients" className="min-w-0 overflow-hidden rounded-lg border bg-card">
          <AgentMcpActivity agentId={agent.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
