"use client";

import { Loading, Unavailable } from "@/components/shared/states";
import { useCatalog } from "@/features/assets";
import { GrantSharedControls } from "./grant-shared-controls";
import { usePolicyView } from "./policy-tab/use-policy-view";
import { rulesFromPolicy } from "./rules/rules";
import { RulesSummary } from "./rules/rules-summary";

/**
 * What a grant lets its holder do: exactly the account's rules in force, read live. A grant only
 * says who may act; the rules are the same for the owner's dashboard and every client, so this
 * is the one place a grant's reach is shown, whether it is being created or viewed.
 */
export function GrantRules({ agentId, holder }: { agentId: string; holder: string }) {
  const catalog = useCatalog();
  const view = usePolicyView(agentId);
  const rules = rulesFromPolicy(view.data?.policy ?? null);
  return (
    <section className="flex flex-col gap-3" aria-label="What this grant allows">
      <div>
        <h3 className="text-sm font-medium">What {holder} can do</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Exactly what this account's rules allow, the same for you and every connected client. Turn
          something on in the rules and every grant can use it at once; turn it off and no one can.
          Signing this grant sends no funds.
        </p>
      </div>
      {view.isPending ? (
        <Loading rows={2} />
      ) : view.error || !view.data ? (
        <Unavailable
          code={view.error?.message ?? "request_failed"}
          onRetry={() => void view.refetch()}
        />
      ) : (
        <>
          <RulesSummary rules={rules} catalog={catalog} />
          <GrantSharedControls rules={rules} />
        </>
      )}
    </section>
  );
}
