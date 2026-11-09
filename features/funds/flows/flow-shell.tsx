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
  type,
  children,
}: {
  tracking: { id: string; status: string } | null;
  title: string;
  onDone: () => void;
  ability?: Ability;
  /** The operation's type, for a status line that depends on it. */
  type?: string;
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
        type={type}
        onDone={onDone}
        onOpenActivity={funds.openActivity}
      />
    );
  if (ability && funds.rules && !funds.rules.abilities[ability])
    return <RuleGate ability={ability} />;
  return children;
}
