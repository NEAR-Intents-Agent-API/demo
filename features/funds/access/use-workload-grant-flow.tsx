"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Callout } from "@/components/shared/callout";
import { REVOKE_NOTICE_TITLE, RevokeNotice } from "@/components/shared/revoke-notice";
import { Button } from "@/components/ui/button";
import { type IntentStep, intentsApi, operationFailure } from "@/features/intents";
import {
  type ConsentChallenge,
  ConsentDialog,
  type ConsentStage,
  signIntent,
} from "@/features/wallet/index";
import { type CommittedOperations, committedAfterRevoke } from "@/lib/agent-api/committed";
import { errorMessage } from "@/lib/http/messages";
import { fundsApi } from "../api";
import { refreshPermissions } from "./refresh-permission-utils";
import { signedPayloadText } from "./signature-utils";
import { WorkloadGrantDialog, type WorkloadGrantRequest } from "./workload-grant-dialog";

type Pending = { step: IntentStep; consent: ConsentChallenge; kind: "issue" | "revoke" };

/**
 * Issuing and revoking grants that belong to a workload. The workload keeps its own identity
 * token or private key, so unlike the dashboard's and MCP clients' grants nothing is stored
 * here: the owner signs, and the grant appears in the access list.
 */
export function useWorkloadGrantFlow(agentId: string, audience: string) {
  const cache = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [stage, setStage] = useState<ConsentStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState<CommittedOperations | null>(null);

  const prepare = useMutation({
    mutationFn: async (
      input: ({ kind: "issue" } & WorkloadGrantRequest) | { kind: "revoke"; grantId: string },
    ): Promise<Pending> => {
      const step =
        input.kind === "issue"
          ? await fundsApi.issueWorkloadGrant(agentId, {
              label: input.label,
              expiresAt: input.expiresAt,
              credential: input.credential,
            })
          : await intentsApi.generate(agentId, {
              type: "grant_revoke",
              agent_id: agentId,
              grant_id: input.grantId,
            });
      return {
        step,
        kind: input.kind,
        consent: {
          owner: step.generated.signer,
          message: step.generated.preview,
          displayMessage: signedPayloadText(step.generated.intent),
        },
      };
    },
    onSuccess: (prepared) => {
      setError(null);
      setStage("idle");
      setFormOpen(false);
      setPending(prepared);
    },
    onError: (cause: Error) => setError(errorMessage(cause)),
  });

  const sign = useCallback(async () => {
    if (!pending) return;
    setStage("signing");
    setError(null);
    try {
      const signed = await signIntent(pending.step.generated);
      setStage("submitting");
      const submitted = await intentsApi.submit(
        agentId,
        pending.step.generated.correlation_id,
        signed,
      );
      if (submitted.operation.status !== "SUCCESS")
        throw new Error(
          operationFailure(submitted.operation.status, submitted.operation.failure_code) ??
            "permission_update_pending",
        );
      await refreshPermissions(cache, agentId);
      setStage("idle");
      setPending(null);
      if (pending.kind === "revoke") setCommitted(committedAfterRevoke(submitted.operation));
    } catch (cause) {
      setStage("error");
      setError(errorMessage(cause));
      await refreshPermissions(cache, agentId);
    }
  }, [agentId, cache, pending]);

  const openForm = useCallback(() => {
    setError(null);
    setFormOpen(true);
  }, []);
  const revoke = useCallback(
    (grantId: string) => {
      setError(null);
      prepare.mutate({ kind: "revoke", grantId });
    },
    [prepare],
  );
  const revoking = prepare.isPending && prepare.variables?.kind === "revoke";

  const dialogs: ReactNode = (
    <>
      {formOpen ? (
        <WorkloadGrantDialog
          open
          onOpenChange={setFormOpen}
          audience={audience}
          busy={prepare.isPending}
          error={error}
          onSubmit={(request) => prepare.mutate({ kind: "issue", ...request })}
        />
      ) : null}
      <ResponsiveDialog
        open={committed !== null}
        onOpenChange={(open) => {
          if (!open) setCommitted(null);
        }}
        title="Access revoked"
        description="This workload can no longer start operations on this account."
        footer={
          <Button size="lg" className="w-full" onClick={() => setCommitted(null)}>
            Done
          </Button>
        }
      >
        {committed ? (
          <Callout tone="warning" title={REVOKE_NOTICE_TITLE}>
            <RevokeNotice
              committed={committed}
              activityHref={`/agents/${encodeURIComponent(agentId)}?tab=activity`}
            />
          </Callout>
        ) : null}
      </ResponsiveDialog>
      <ConsentDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && stage !== "signing" && stage !== "submitting") setPending(null);
        }}
        title={pending?.kind === "revoke" ? "Revoke workload access" : "Authorize workload"}
        description={
          pending?.kind === "revoke"
            ? "You sign to end the grant. Anything already dispatched still completes."
            : "You sign access for this workload until the selected date. Account rules apply to every grant."
        }
        challenge={pending?.consent ?? null}
        stage={stage}
        error={error}
        confirmLabel={pending?.kind === "revoke" ? "Sign to revoke access" : "Sign to authorize"}
        onSign={sign}
      />
    </>
  );

  return { openForm, revoke, revoking, dialogs, busy: prepare.isPending || pending !== null };
}
