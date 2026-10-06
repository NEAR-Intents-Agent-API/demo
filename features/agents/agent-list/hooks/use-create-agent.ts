"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { IntentStep } from "@/features/intents";
import { defaultRules, policyFromRules, type Rules } from "@/features/policy/model";
import { terminalStatuses } from "@/lib/agent-api/schemas";
import { queryKeys } from "@/lib/query/keys";
import { agentsApi } from "../../api/agents-api";
import { type CreateInput, createAgentSchema } from "../../model/schemas";
import { finishOnboarding } from "./finish-onboarding";

export function useCreateAgent() {
  const cache = useQueryClient();
  const router = useRouter();
  const running = useRef(false);
  const prepared = useRef<IntentStep | null>(null);
  const [rules, setRules] = useState<Rules>(() => structuredClone(defaultRules));
  const [stage, setStage] = useState("");
  const form = useForm<CreateInput>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: { name: "" },
  });
  const create = useMutation({
    mutationFn: async (input: CreateInput) => {
      setStage(prepared.current ? "Resuming activation…" : "Creating agent account…");
      prepared.current = prepared.current
        ? await agentsApi.onboarding(prepared.current.generated.agent_id)
        : await agentsApi.create(input.name, policyFromRules(null, rules));
      void cache.invalidateQueries({ queryKey: queryKeys.agents() });
      return finishOnboarding(prepared.current, setStage);
    },
    onSuccess: (state) => {
      prepared.current = null;
      form.reset();
      setRules(structuredClone(defaultRules));
      router.replace(
        `/agents/${encodeURIComponent(state.generated.agent_id)}?tab=activity&setup=fund`,
      );
    },
    onError: () => {
      const status = prepared.current?.operation.status;
      // Keep unknown and pending outcomes resumable; a confirmed failure permits a new draft.
      if (status && status !== "SUCCESS" && terminalStatuses.includes(status))
        prepared.current = null;
    },
    onSettled: async () => {
      running.current = false;
      setStage("");
      await cache.invalidateQueries({ queryKey: queryKeys.agents() });
    },
  });

  return {
    rules,
    setRules,
    stage,
    form,
    create,
    hasPendingActivation: prepared.current !== null,
    pendingAgentId: prepared.current?.generated.agent_id,
    submit: (values: CreateInput) => {
      if (running.current) return;
      running.current = true;
      create.mutate(values);
    },
  };
}
