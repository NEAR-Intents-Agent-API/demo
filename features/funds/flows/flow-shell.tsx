"use client";

import type { Ability } from "@/features/policy/model";
import { useFunds } from "../funds-context";
import { OperationTracker } from "../operations/operation-tracker";
import { RuleGate } from "./rule-gate";

export function FlowShell({
  tracking,
  title,
  onDone,
  ability,
  children,
}: {
  tracking: { id: string; status: string } | null;
  title: string;
  onDone: () => void;
  ability?: Ability;
  children: React.ReactNode;
}) {
  const funds = useFunds();
  if (tracking)
    return (
      <OperationTracker
        agentId={funds.agent.id}
        operationId={tracking.id}
        initialStatus={tracking.status}
        title={title}
        onDone={onDone}
        onOpenActivity={funds.openActivity}
      />
    );
  if (ability && funds.rules && !funds.rules.abilities[ability])
    return <RuleGate ability={ability} />;
  return children;
}
