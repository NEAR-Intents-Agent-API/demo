import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Rules } from "../../rules/rules";
import { PolicySettingRow } from "./policy-setting-row";
import {
  isAbilitySetting,
  isToggleSetting,
  type RuleSetting,
  type ToggleSettingId,
} from "./rule-setting-definitions";

export function RuleSettingRow({
  setting,
  value,
  canEdit,
  busy,
  onEdit,
  onToggle,
  rules,
}: {
  setting: RuleSetting;
  value: React.ReactNode;
  canEdit: boolean;
  busy: boolean;
  onEdit: () => void;
  onToggle: (id: ToggleSettingId, checked: boolean) => void;
  rules: Rules;
}) {
  const id = setting.id;
  const toggle = isToggleSetting(id);
  const checked = isAbilitySetting(id) ? rules.abilities[id] : rules.approval;
  const editButton = (
    <Button
      variant="outline"
      size="sm"
      className="w-18 px-0"
      aria-label={`Edit ${setting.title}`}
      disabled={busy}
      onClick={onEdit}
    >
      Edit
    </Button>
  );
  return (
    <PolicySettingRow
      title={setting.title}
      description={setting.description}
      value={value}
      action={
        canEdit ? (
          toggle ? (
            <div className="flex items-center justify-end gap-3">
              <Switch
                label={setting.title}
                showState
                checked={checked}
                disabled={busy}
                onChange={(value) => onToggle(id, value)}
                className="py-0 [&>label]:sr-only [&>button]:mt-0"
              />
            </div>
          ) : (
            editButton
          )
        ) : undefined
      }
    />
  );
}
