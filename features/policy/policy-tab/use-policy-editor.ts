"use client";

import type { AgentView, PolicyView } from "@near-intents-agent-api/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useCatalog } from "@/features/assets";
import { DemoApiError } from "@/lib/http/request";
import { rulesState } from "@/lib/policy/rules-state";
import { queryKeys } from "@/lib/query/keys";
import { policyApi } from "../api";
import { policyFromRules, type Rules, rulesFromPolicy } from "../rules/rules";
import { pendingChange } from "./pending-change";
import { changedRuleSettings } from "./rule-changes-utils";
import {
  isAbilitySetting,
  type RuleSettingId,
  type ToggleSettingId,
} from "./settings/rule-setting-definitions";
import { useCooldown } from "./use-cooldown";
import { usePolicyWorkflow } from "./use-policy-workflow";

const isRevisionConflict = (cause: unknown) =>
  cause instanceof DemoApiError && cause.code === "policy_revision_conflict";

export function usePolicyEditor(agent: AgentView, view: PolicyView) {
  const catalog = useCatalog();
  const workflow = usePolicyWorkflow(agent.id);
  const [draft, setDraft] = useState<{ rules: Rules; baseRevision: number } | null>(null);
  const [activeSetting, setActiveSetting] = useState<RuleSettingId | null>(null);
  const [conflict, setConflict] = useState(false);
  const current = rulesFromPolicy(view.policy);
  const editing = draft?.rules ?? null;
  const canSign = Boolean(agent.owner && agent.owner_account);
  const busy = workflow.save.isPending;
  const saveError = workflow.save.error;
  // A conflict has its own notice; the generic error line would repeat it.
  const error = (isRevisionConflict(saveError) ? null : saveError) ?? workflow.saved.error ?? null;
  const state = rulesState(view);
  const frozen = Boolean(view.policy?.frozen);
  const revision = view.revision ?? 0;
  const changeAvailableAt = useCooldown(view.cooldowns.policy_change_available_at);
  const pending = pendingChange(workflow.saved.data, view.revision);
  // The rules moved on (another tab, a freeze) after this draft was started.
  const stale = Boolean(draft && draft.baseRevision !== revision);
  const changes = editing ? changedRuleSettings(current, editing) : [];
  const turnsPrivateBalanceOff =
    changes.some((setting) => setting.id === "confidential") && !editing?.abilities.confidential;
  const privateBalance = useQuery({
    queryKey: queryKeys.balances(agent.id, "confidential"),
    queryFn: () => policyApi.privateBalances(agent.id),
    enabled: turnsPrivateBalanceOff,
  });
  const holdsPrivateFunds = Boolean(
    turnsPrivateBalanceOff &&
      privateBalance.data?.balances.some((entry) => BigInt(entry.balance_raw) > 0n),
  );

  const editDraft = (update: (rules: Rules) => Rules) => {
    setConflict(false);
    setDraft((previous) => ({
      rules: update(previous?.rules ?? current),
      baseRevision: previous?.baseRevision ?? revision,
    }));
  };
  const setEditing = (rules: Rules) => editDraft(() => rules);
  const beginEditing = (id: RuleSettingId) => {
    editDraft((rules) => rules);
    setActiveSetting(id);
  };
  const cancelEditing = () => {
    setDraft(null);
    setActiveSetting(null);
  };
  const closeEditor = () => {
    setActiveSetting(null);
  };
  const toggleSetting = (id: ToggleSettingId, checked: boolean) =>
    editDraft((rules) =>
      isAbilitySetting(id)
        ? { ...rules, abilities: { ...rules.abilities, [id]: checked } }
        : { ...rules, approval: checked },
    );

  const submit = (rules: Rules) => {
    if (!draft) return;
    workflow.save.mutate(
      { policy: policyFromRules(view.policy, rules), expectedRevision: draft.baseRevision },
      {
        onSuccess: cancelEditing,
        onError: (cause) => {
          // The rules changed meanwhile: drop the draft so the owner reads the current rules
          // (already being refetched) before deciding again.
          if (isRevisionConflict(cause)) {
            cancelEditing();
            setConflict(true);
          }
        },
      },
    );
  };

  return {
    catalog,
    workflow,
    editing,
    setEditing,
    current,
    changes,
    canSign,
    busy,
    error,
    state,
    frozen,
    submit,
    activeSetting,
    beginEditing,
    cancelEditing,
    closeEditor,
    toggleSetting,
    pending,
    stale,
    conflict: conflict || stale,
    changeAvailableAt,
    holdsPrivateFunds,
  };
}
