"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PolicyTab } from "@/features/policy/index";
import type { useAgentTab } from "../hooks/use-agent-tab";
import { ActivityTab } from "../tabs/activity-tab";

export function AgentAccountTabs({
  agent,
  navigation,
  disabled = false,
}: {
  agent: AgentView;
  navigation: ReturnType<typeof useAgentTab>;
  disabled?: boolean;
}) {
  const { tab, setTab } = navigation;

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        if (!disabled) setTab(next);
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between gap-2 border-b pb-1">
        <TabsList variant="line" className="min-w-0 flex-1 justify-start gap-2 px-0 sm:gap-5">
          <TabsTrigger value="rules" disabled={disabled} className="px-2 sm:flex-none sm:px-3">
            Rules
          </TabsTrigger>
          <TabsTrigger value="activity" disabled={disabled} className="px-2 sm:flex-none sm:px-3">
            Activity
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="activity">
        <ActivityTab agent={agent} />
      </TabsContent>
      <TabsContent value="rules">
        <PolicyTab agent={agent} />
      </TabsContent>
    </Tabs>
  );
}
