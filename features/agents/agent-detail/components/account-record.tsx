import type { AgentView } from "@near-intents-agent-api/sdk";
import { MonoId } from "@/components/shared/identifiers";
import { accountTimestamp } from "@/lib/format/date";

export function AccountRecord({ agent }: { agent: AgentView }) {
  return (
    <section className="space-y-3 border-t pt-4" aria-label="Account record">
      <h2 className="text-sm font-medium">Account record</h2>
      <dl className="grid min-w-0 gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
        <div className="min-w-0 space-y-1">
          <dt className="text-muted-foreground">Account ID</dt>
          <dd>
            <MonoId
              value={agent.id}
              head={12}
              tail={6}
              className="max-w-full text-xs"
              label="Copy account ID"
            />
          </dd>
        </div>
        <div className="min-w-0 space-y-1">
          <dt className="text-muted-foreground">External user ID</dt>
          <dd>
            {agent.external_user_id !== null ? (
              <MonoId
                value={agent.external_user_id}
                head={10}
                tail={6}
                className="max-w-full text-xs"
                label="Copy external user ID"
              />
            ) : (
              "Unassigned"
            )}
          </dd>
        </div>
        <div className="min-w-0 space-y-1">
          <dt className="text-muted-foreground">Created</dt>
          <dd>{accountTimestamp(agent.created_at)}</dd>
        </div>
        <div className="min-w-0 space-y-1">
          <dt className="text-muted-foreground">Archived</dt>
          <dd>{agent.archived ? "Yes · read-only" : "No"}</dd>
        </div>
      </dl>
    </section>
  );
}
