"use client";

import type { ApprovalView, SignedData } from "@near-intents-agent-api/sdk";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { type IntentStep, intentsApi } from "@/features/intents";
import { errorMessage } from "@/lib/http/messages";
import { queryKeys } from "@/lib/query/keys";
import { walletApi } from "../api";
import type { ConsentChallenge, ConsentStage } from "../components/consent-dialog";
import { signIntent } from "../sign-intent";
import {
  decidedApprovals,
  readApproval,
  readSeenApprovals,
  rememberApprovals,
  writeSeenApprovals,
} from "./approval-history";

export type PendingDecision = {
  approvalId: string;
  verdict: "approve" | "reject";
  challenge: IntentStep;
  consent: ConsentChallenge;
};

/** Requests the provider is holding for an owner vote, and the two-step signing ceremony. */
export function useApprovals(agentId: string) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<PendingDecision | null>(null);
  const [stage, setStage] = useState<ConsentStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const approvals = useQuery({
    queryKey: queryKeys.approvals(agentId),
    queryFn: () => walletApi.approvals(agentId),
    refetchOnWindowFocus: true,
  });
  const entries = pendingApprovals(approvals.data?.data);

  // The waiting list drops a request once it is decided or expired, so the ids seen waiting are
  // kept for the session and their outcomes are read back one by one.
  const [seen, setSeen] = useState(() => readSeenApprovals(agentId));
  const waitingKey = entries.map((entry) => entry.approval_id).join(",");
  useEffect(() => {
    setSeen((previous) => {
      const next = rememberApprovals(previous, waitingKey ? waitingKey.split(",") : []);
      if (next.join() === previous.join()) return previous;
      writeSeenApprovals(agentId, next);
      return next;
    });
  }, [agentId, waitingKey]);
  const history = useQueries({
    queries: seen
      .filter((id) => !waitingKey.split(",").includes(id))
      .map((id) => ({
        queryKey: queryKeys.approval(agentId, id),
        queryFn: () => readApproval(agentId, id),
      })),
  });

  const prepare = useMutation({
    mutationFn: async (input: { approvalId: string; verdict: "approve" | "reject" }) => {
      const challenge = await intentsApi.generate(agentId, {
        type: "approval_vote",
        agent_id: agentId,
        approval_id: input.approvalId,
        verdict: input.verdict,
      });
      const consent: ConsentChallenge = {
        owner: challenge.generated.signer,
        message: challenge.generated.preview,
        displayMessage: JSON.stringify(challenge.generated.intent.payload, null, 2),
      };
      return { ...input, challenge, consent };
    },
    onSuccess: (result) => {
      setError(null);
      setDecision(result);
      setStage("idle");
    },
    onError: (cause: Error) => setError(errorMessage(cause.message)),
  });

  const vote = useMutation({
    mutationFn: async (input: { signedData: SignedData }) => {
      if (!decision) throw new Error("approval_not_prepared");
      return intentsApi.submit(
        agentId,
        decision.challenge.generated.correlation_id,
        input.signedData,
      );
    },
    onSuccess: async () => {
      setStage("idle");
      setDecision(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.approvals(agentId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.policy(agentId) });
    },
    onError: (cause: Error) => {
      setStage("error");
      setError(errorMessage(cause.message));
    },
  });

  const signAndVote = async () => {
    if (!decision) return;
    setStage("signing");
    setError(null);
    try {
      const signedData = await signIntent(decision.challenge.generated);
      setStage("submitting");
      vote.mutate({ signedData });
    } catch (cause) {
      setStage("error");
      setError(cause instanceof Error ? errorMessage(cause.message) : "signing_failed");
    }
  };

  return {
    approvals,
    entries,
    decided: decidedApprovals(history.map((entry) => entry.data)),
    prepare,
    decision,
    setDecision,
    stage,
    error,
    signAndVote,
  };
}

export function pendingApprovals(data: unknown): ApprovalView[] {
  if (!Array.isArray(data)) return [];
  return data.filter((entry): entry is ApprovalView =>
    Boolean(entry && entry.status === "PENDING" && typeof entry.approval_id === "string"),
  );
}
