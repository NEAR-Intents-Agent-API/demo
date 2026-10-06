"use client";

import type { AgentView, PolicyView } from "@near-intents-agent-api/sdk";
import { useState } from "react";
import { useCatalog } from "@/features/assets";
import { rulesState } from "@/lib/policy/rules-state";
import { policyFromRules, type Rules, rulesFromPolicy } from "../rules/rules";
import { ownerCanApprove } from "./policy-rules-utils";
import { changedRuleSettings } from "./rule-changes-utils";
import {
  isAbilitySetting,
  type RuleSettingId,
  type ToggleSettingId,
} from "./settings/rule-setting-definitions";
import { usePolicyWorkflow } from "./use-policy-workflow";

export function usePolicyEditor(agent: AgentView, view: PolicyView) {
  const catalog = useCatalog();
  const workflow = usePolicyWorkflow(agent.id);
  const [editing, setEditing] = useState<Rules | null>(null);
  const [activeSetting, setActiveSetting] = useState<RuleSettingId | null>(null);
  const current = rulesFromPolicy(view.policy);
  const canSign = Boolean(agent.owner && agent.owner_account);
  const approvalAvailable = ownerCanApprove(agent);
  const busy = workflow.save.isPending;
  const error = workflow.save.error ?? workflow.saved.error;
  const state = rulesState(view);
  const frozen = Boolean(view.policy?.frozen);

  const beginEditing = (id: RuleSettingId) => {
    setEditing((draft) => draft ?? current);
    setActiveSetting(id);
  };
  const cancelEditing = () => {
    setEditing(null);
    setActiveSetting(null);
  };
  const closeEditor = () => {
    setActiveSetting(null);
  };
  const toggleSetting = (id: ToggleSettingId, checked: boolean) => {
    setEditing((draft) => {
      const rules = draft ?? current;
      return isAbilitySetting(id)
        ? { ...rules, abilities: { ...rules.abilities, [id]: checked } }
        : { ...rules, approval: checked };
    });
  };

  const submit = (rules: Rules) =>
    workflow.save.mutate(policyFromRules(view.policy, rules), {
      onSuccess: cancelEditing,
    });

  return {
    catalog,
    workflow,
    editing,
    setEditing,
    current,
    changes: editing ? changedRuleSettings(current, editing) : [],
    canSign,
    approvalAvailable,
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
  };
}
