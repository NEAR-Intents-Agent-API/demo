"use client";

import { SnowIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AgentView, PolicyView } from "@near-intents-agent-api/sdk";
import { Callout } from "@/components/shared/callout";
import { errorMessage } from "@/lib/http/messages";
import { PolicyChangeSummary } from "./policy-change-summary";
import { PolicyNotices } from "./policy-notices";
import { ApplyingNotice, PolicyState } from "./policy-status";
import { PolicyEditDialog } from "./settings/policy-edit-dialog";
import { RULE_SETTING_GROUPS } from "./settings/rule-setting-definitions";
import { RuleSettingGroup } from "./settings/rule-setting-group";
import { usePolicyEditor } from "./use-policy-editor";

/**
 * The one panel every rules change goes through: read by default, edit on request, and one
 * signature to install. The rules summary comes from the same `Rules` model the editor edits, so
 * the two can never disagree.
 */
export function PolicyRules({ agent, view }: { agent: AgentView; view: PolicyView }) {
  const {
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
    conflict,
    changeAvailableAt,
    holdsPrivateFunds,
  } = usePolicyEditor(agent, view);
  const blockedReason = stale
    ? "The rules changed after you started editing."
    : pending.kind === "in_flight"
      ? "A previous rules change is still settling."
      : changeAvailableAt
        ? `The next rules change is possible at ${changeAvailableAt.toLocaleString()}. Freezing stays available.`
        : undefined;

  return (
    <section
      className="space-y-6"
      aria-description="Every grant can do exactly what these account rules allow, with one shared budget."
    >
      {frozen ? (
        <Callout tone="danger" className="mb-4">
          <span className="flex items-center gap-2">
            <HugeiconsIcon icon={SnowIcon} className="size-4" />
            Frozen: the provider refuses every move until you unfreeze below.
          </span>
        </Callout>
      ) : null}
      <ApplyingNotice state={state} />
      {RULE_SETTING_GROUPS.map((group, index) => (
        <RuleSettingGroup
          key={group.title}
          {...group}
          actions={index === 0 ? <PolicyState view={view} /> : undefined}
          current={editing ?? current}
          usage={view.usage.budget}
          catalog={catalog}
          canSign={canSign}
          busy={busy}
          onEdit={beginEditing}
          onToggle={toggleSetting}
        />
      ))}
      {editing && activeSetting ? (
        <PolicyEditDialog
          id={activeSetting}
          rules={editing}
          catalog={catalog}
          usage={view.usage.budget}
          busy={busy}
          error={error?.message}
          onChange={setEditing}
          onClose={closeEditor}
        />
      ) : null}
      {editing && changes.length > 0 ? (
        <PolicyChangeSummary
          current={current}
          draft={editing}
          changes={changes}
          catalog={catalog}
          usage={view.usage.budget}
          busy={busy}
          stage={workflow.stage}
          blockedReason={blockedReason}
          warning={
            holdsPrivateFunds
              ? "This account holds a private balance. While Private balance is off, those funds cannot be moved back to the public balance; turn it back on first."
              : undefined
          }
          onCancel={cancelEditing}
          onSave={() => submit(editing)}
        />
      ) : null}
      <PolicyNotices
        editing={editing}
        busy={busy}
        conflict={conflict}
        pending={pending}
        changeAvailableAt={changeAvailableAt}
        workflow={workflow}
        onReview={setEditing}
        onDiscard={cancelEditing}
      />
      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {errorMessage(error.message)}
        </p>
      ) : null}
    </section>
  );
}
