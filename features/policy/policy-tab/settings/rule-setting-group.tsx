import type { PolicyView } from "@near-intents-agent-api/sdk";
import type { Rules } from "../../rules/rules";
import type { SummaryCatalog } from "../../rules/summary/summary-types";
import type { RuleSetting, RuleSettingId, ToggleSettingId } from "./rule-setting-definitions";
import { RuleSettingRow } from "./rule-setting-row";
import { RuleSettingValue } from "./rule-setting-value";

export function RuleSettingGroup({
  title,
  description,
  actions,
  rows,
  current,
  usage,
  catalog,
  canSign,
  approvalAvailable,
  busy,
  onEdit,
  onToggle,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  rows: readonly RuleSetting[];
  current: Rules;
  usage: PolicyView["usage"]["budget"];
  catalog: SummaryCatalog;
  canSign: boolean;
  approvalAvailable: boolean;
  busy: boolean;
  onEdit: (id: RuleSettingId) => void;
  onToggle: (id: ToggleSettingId, checked: boolean) => void;
}) {
  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="console-heading">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        {actions}
      </header>
      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {rows.map((setting) => (
          <RuleSettingRow
            key={setting.id}
            setting={setting}
            value={
              <RuleSettingValue id={setting.id} rules={current} catalog={catalog} usage={usage} />
            }
            canEdit={canSign && (setting.id !== "approval" || approvalAvailable)}
            rules={current}
            onToggle={onToggle}
            busy={busy}
            onEdit={() => onEdit(setting.id)}
          />
        ))}
      </div>
    </section>
  );
}
