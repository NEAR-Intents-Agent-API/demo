import { Disclosure } from "@/components/shared/disclosure";
import type { Rules } from "../../rules/rules";
import { DestinationsLine } from "../../rules/summary/destinations-line";

export function DestinationsSettingValue({ rules }: { rules: Rules }) {
  const { mode, list } = rules.destinations;
  if (mode === "any") return <span>Anywhere</span>;
  if (mode === "only" && list.length === 0) return <DestinationsLine rules={rules} />;
  return (
    <Disclosure
      summary={`${mode === "only" ? "Only" : "Except"} ${list.length} destination${list.length === 1 ? "" : "s"}`}
    >
      <div className="mt-3 flex flex-wrap gap-2">
        <DestinationsLine rules={rules} />
      </div>
    </Disclosure>
  );
}
