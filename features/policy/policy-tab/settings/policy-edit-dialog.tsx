import type { PolicyView } from "@near-intents-agent-api/sdk";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { errorMessage } from "@/lib/http/messages";
import { type Rules, rulesProblem } from "../../rules/rules";
import type { SummaryCatalog } from "../../rules/summary/summary-types";
import { BudgetEditUsage } from "./budget-edit-usage";
import { isBudgetSetting } from "./budget-setting-utils";
import { ruleDialogDescription } from "./rule-dialog-copy";
import { RULE_SETTING_GROUPS, type RuleSettingId } from "./rule-setting-definitions";
import { RuleSettingEditor } from "./rule-setting-editor";

export function PolicyEditDialog({
  id,
  rules,
  catalog,
  usage,
  busy,
  error,
  onChange,
  onClose,
}: {
  id: RuleSettingId;
  rules: Rules;
  catalog: SummaryCatalog;
  usage: PolicyView["usage"]["budget"];
  busy: boolean;
  error?: string;
  onChange: (rules: Rules) => void;
  onClose: () => void;
}) {
  const setting = RULE_SETTING_GROUPS.flatMap((group) => group.rows).find((row) => row.id === id);
  const problem = rulesProblem(rules);
  return (
    <ResponsiveDialog
      open
      busy={busy}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Edit ${setting?.title.toLowerCase() ?? "rule"}`}
      description={ruleDialogDescription(id)}
      descriptionClassName="text-xs leading-5"
      bodyClassName="@container/rules space-y-4 py-3"
      contentClassName="sm:max-w-md"
      showDrawerCloseButton
    >
      <RuleSettingEditor
        id={id}
        rules={rules}
        catalog={catalog}
        onChange={onChange}
        disabled={busy}
      />
      {isBudgetSetting(id) ? <BudgetEditUsage field={id} usage={usage} /> : null}
      {problem ? (
        <p role="alert" className="text-sm text-warning">
          {problem}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(error)}
        </p>
      ) : null}
    </ResponsiveDialog>
  );
}
