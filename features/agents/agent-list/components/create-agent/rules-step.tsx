"use client";

import { Button } from "@/components/ui/button";
import { useCatalog } from "@/features/assets";
import { RulesEditor } from "@/features/policy/index";
import type { Rules } from "@/features/policy/model";
import { RulesOverview } from "./rules-overview";

/** Step two body: the rules this signature installs, with the editor one click away. */
export function RulesStep({
  rules,
  onRulesChange,
  pending,
  hasPendingActivation,
  editing,
  onEditingChange,
}: {
  rules: Rules;
  onRulesChange: (rules: Rules) => void;
  pending: boolean;
  hasPendingActivation: boolean;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  const catalog = useCatalog();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{editing ? "Account rules" : "Rules summary"}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || hasPendingActivation}
          onClick={() => onEditingChange(!editing)}
        >
          {editing ? "Back to summary" : "Edit rules"}
        </Button>
      </div>
      {editing ? (
        <RulesEditor
          grouped
          rules={rules}
          onChange={onRulesChange}
          catalog={catalog}
          approvalAvailable={false}
          disabled={pending || hasPendingActivation}
        />
      ) : (
        <RulesOverview rules={rules} />
      )}

      <p className="border-t pt-3 text-xs leading-5 text-muted-foreground">
        Rules apply to every client. Signature gas and storage are sponsored.
      </p>
    </div>
  );
}
