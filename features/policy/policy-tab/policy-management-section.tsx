import { PolicySettingRow } from "./settings/policy-setting-row";

export function PolicyManagementSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <PolicySettingRow
        title={title}
        description={description}
        value={<div className="w-full min-w-0">{children}</div>}
        action={actions}
      />
    </section>
  );
}
