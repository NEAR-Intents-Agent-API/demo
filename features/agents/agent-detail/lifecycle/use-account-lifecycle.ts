"use client";

import type { AgentView, PolicyView } from "@near-intents-agent-api/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { fundsApi, signedPayloadText } from "@/features/funds/index";
import { type IntentStep, intentsApi, observeIntent, operationFailure } from "@/features/intents";
import { usePolicyView } from "@/features/policy/data";
import { type ConsentChallenge, type ConsentStage, signIntent } from "@/features/wallet/index";
import { errorMessage } from "@/lib/http/messages";
import { queryKeys } from "@/lib/query/keys";
import {
  type LifecycleAction,
  type LifecyclePlan,
  type LifecycleStep,
  lifecyclePlan,
  needsReplan,
  rulesReading,
} from "./lifecycle-state";

type Run = {
  action: LifecycleAction;
  steps: LifecycleStep[];
  index: number;
  step: IntentStep | null;
};

/**
 * Archive, restore and delete as one signing run. Each action is the short list of intents the
 * API requires (see `lifecyclePlan`); the hook prepares one, lets the owner sign it, waits for it
 * to land, then prepares the next. A failure in the middle leaves the run on the step that failed,
 * so signing again retries exactly that step, and a fresh run re-plans from the new state.
 */
export function useAccountLifecycle(agent: AgentView) {
  const cache = useQueryClient();
  const router = useRouter();
  const policy = usePolicyView(agent.id);
  const [run, setRun] = useState<Run | null>(null);
  const [stage, setStage] = useState<ConsentStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef(0);

  const rules = rulesReading(policy.data, policy.isError);
  const plan = useCallback(
    (action: LifecycleAction): LifecyclePlan => lifecyclePlan(action, agent, rules, Date.now()),
    [agent, rules],
  );

  const prepare = useCallback(
    async (next: Run) => {
      const type = next.steps[next.index];
      if (!type) return;
      const current = ++attempt.current;
      setRun({ ...next, step: null });
      setStage("preparing");
      setError(null);
      try {
        const step = await intentsApi.generate(agent.id, {
          type,
          agent_id: agent.id,
        });
        if (current !== attempt.current) return;
        setRun({ ...next, step });
        setStage("idle");
      } catch (cause) {
        if (current !== attempt.current) return;
        setStage("error");
        setError(errorMessage(cause));
      }
    },
    [agent.id],
  );

  const start = useCallback(
    (action: LifecycleAction) => {
      const planned = plan(action);
      if (planned.ok) void prepare({ action, steps: planned.steps, index: 0, step: null });
    },
    [plan, prepare],
  );

  const close = useCallback(() => {
    attempt.current += 1;
    setRun(null);
    setStage("idle");
    setError(null);
  }, []);

  const refresh = useCallback(
    () =>
      Promise.all(
        [
          queryKeys.agent(agent.id),
          queryKeys.policy(agent.id),
          queryKeys.controls(agent.id),
          queryKeys.operations(agent.id),
          queryKeys.agents(),
        ].map((queryKey) => cache.invalidateQueries({ queryKey })),
      ),
    [agent.id, cache],
  );

  // Start over from what the account is now: reread its rules and status, re-plan, prepare again.
  const retry = useCallback(async () => {
    if (!run) return;
    const current = ++attempt.current;
    setStage("preparing");
    setError(null);
    await refresh();
    if (current !== attempt.current) return;
    const latest = cache.getQueryData<AgentView>(queryKeys.agent(agent.id)) ?? agent;
    const view = cache.getQueryData<PolicyView>(queryKeys.policy(agent.id));
    const planned = lifecyclePlan(run.action, latest, rulesReading(view, !view), Date.now());
    if (!planned.ok) {
      setRun({ ...run, step: null });
      setStage("error");
      setError(planned.reason);
      return;
    }
    await prepare({ action: run.action, steps: planned.steps, index: 0, step: null });
  }, [agent, cache, prepare, refresh, run]);

  const sign = useCallback(async () => {
    const step = run?.step;
    if (!run || !step) return;
    setStage("signing");
    setError(null);
    try {
      const signed = await signIntent(step.generated);
      setStage("submitting");
      const submitted = await intentsApi.submit(agent.id, step.generated.correlation_id, signed);
      await observeIntent({
        read: async () =>
          submitted.operation.status === "SUCCESS"
            ? submitted.operation
            : fundsApi.operation(agent.id, step.generated.correlation_id, true, 25_000),
        done: (operation) => operation.status === "SUCCESS",
        failure: (operation) => operationFailure(operation.status, operation.failure_code),
        timeoutCode: "lifecycle_pending",
      });
      await refresh();
      if (run.index + 1 < run.steps.length) {
        await prepare({ ...run, index: run.index + 1, step: null });
        return;
      }
      close();
      if (run.action === "delete") router.push("/agents");
    } catch (cause) {
      setStage("error");
      setError(errorMessage(cause));
      // A request that cannot be signed any more is dropped, so the dialog offers a fresh one.
      if (needsReplan(cause)) setRun({ ...run, step: null });
      await refresh();
    }
  }, [agent.id, close, prepare, refresh, router, run]);

  const challenge: ConsentChallenge | null = run?.step
    ? {
        owner: run.step.generated.signer,
        message: run.step.generated.preview,
        displayMessage: signedPayloadText(run.step.generated.intent),
      }
    : null;

  return {
    run,
    stage,
    error,
    plan,
    start,
    close,
    sign,
    retry: () => void retry(),
    challenge,
    loadingRules: policy.isPending,
  };
}
