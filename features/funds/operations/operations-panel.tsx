"use client";

import type { AgentView } from "@near-intents-agent-api/sdk";
import { Loading, Unavailable } from "@/components/shared/states";
import { RequestsTable } from "./requests-table";
import { useOperations } from "./use-operations";

/** Every request the API recorded for this account, with the chain outcome it observed. */
export function OperationsPanel({ agent }: { agent: AgentView }) {
  const operations = useOperations(agent.id);

  return (
    <div className="min-w-0">
      {operations.isPending ? (
        <Loading rows={3} className="p-4 sm:p-5" />
      ) : operations.error ? (
        <Unavailable
          code={operations.error.message}
          onRetry={() => void operations.refetch()}
          className="m-4 sm:m-5"
        />
      ) : operations.data ? (
        <RequestsTable operations={operations.data.data} />
      ) : null}
    </div>
  );
}
