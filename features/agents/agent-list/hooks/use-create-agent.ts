"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { IntentStep } from "@/features/intents";
import {
  defaultRules,
  policyFromRules,
  type Rules,
  rulesFromPolicy,
} from "@/features/policy/model";
import { queryKeys } from "@/lib/query/keys";
import { onboardingState } from "../../agent-detail/onboarding-state";
import { agentsApi } from "../../api/agents-api";
import { type CreateInput, createAgentSchema } from "../../model/schemas";
import { clearDraft, readDraft, writeDraft } from "./create-draft";
import { finishOnboarding } from "./finish-onboarding";

export function useCreateAgent() {
  const cache = useQueryClient();
  const router = useRouter();
  const running = useRef(false);
  const [prepared, setPrepared] = useState<IntentStep | null>(null);
  const [restored, setRestored] = useState(false);
  const [rules, setRules] = useState<Rules>(() => structuredClone(defaultRules));
  const [stage, setStage] = useState("");
  const form = useForm<CreateInput>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: { name: "" },
  });
  const name = form.watch("name");

  // Put back what a reload or a Back press took away: the name, the rules and, if a request
  // was already prepared for them, that request (so resuming never makes a second account).
  useEffect(() => {
    const draft = readDraft();
    if (!draft) {
      setRestored(true);
      return;
    }
    form.reset({ name: draft.name });
    setRules(draft.rules);
    if (!draft.agentId) {
      setRestored(true);
      return;
    }
    let live = true;
    agentsApi
      .onboarding(draft.agentId)
      .then((step) => {
        if (!live || ["expired", "done"].includes(onboardingState(step))) return;
        setPrepared(step);
        // The prepared request, not the draft, is what the signature installs.
        if (step.generated.preview.policy) setRules(rulesFromPolicy(step.generated.preview.policy));
      })
      .catch(() => {})
      .finally(() => live && setRestored(true));
    return () => {
      live = false;
    };
  }, [form]);

  useEffect(() => {
    if (!restored) return;
    if (!name.trim() && !prepared && JSON.stringify(rules) === JSON.stringify(defaultRules))
      clearDraft();
    else writeDraft({ name, rules, agentId: prepared?.generated.agent_id });
  }, [restored, name, rules, prepared]);

  const create = useMutation({
    mutationFn: async (input: CreateInput) => {
      setStage(prepared ? "Resuming activation…" : "Creating agent account…");
      let step = prepared ? await agentsApi.onboarding(prepared.generated.agent_id) : null;
      // A request that expired or failed can never be signed; ask for a fresh one.
      if (!step || onboardingState(step) === "expired") {
        setStage("Creating agent account…");
        step = await agentsApi.create(input.name, policyFromRules(null, rules));
      }
      setPrepared(step);
      void cache.invalidateQueries({ queryKey: queryKeys.agents() });
      return finishOnboarding(step, setStage);
    },
    onSuccess: (state) => {
      setPrepared(null);
      clearDraft();
      form.reset();
      setRules(structuredClone(defaultRules));
      router.replace(
        `/agents/${encodeURIComponent(state.generated.agent_id)}?tab=activity&setup=fund`,
      );
    },
    onError: async () => {
      if (!prepared) return;
      // Keep unknown and pending outcomes resumable; an expired or failed request permits a new one.
      const step = await agentsApi.onboarding(prepared.generated.agent_id).catch(() => null);
      if (step && onboardingState(step) === "expired") setPrepared(null);
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
    hasPendingActivation: prepared !== null,
    pendingAgentId: prepared?.generated.agent_id,
    submit: (values: CreateInput) => {
      if (running.current) return;
      running.current = true;
      create.mutate(values);
    },
  };
}
