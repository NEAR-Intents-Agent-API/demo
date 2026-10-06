"use client";

import type { PolicyView } from "@near-intents-agent-api/sdk";
import { createPortal } from "react-dom";
import { Disclosure } from "@/components/shared/disclosure";
import type { Rules } from "../rules/rules";
import { rulesProblem } from "../rules/rules";
import type { SummaryCatalog } from "../rules/summary/summary-types";
import { PolicySaveBar } from "./policy-save-bar";
import { RuleChangeValue } from "./rule-change-value";
import type { RuleSetting } from "./settings/rule-setting-definitions";

export function PolicyChangeSummary({
  current,
  draft,
  changes,
  catalog,
  usage,
  busy,
  stage,
  onCancel,
  onSave,
}: {
  current: Rules;
  draft: Rules;
  changes: readonly RuleSetting[];
  catalog: SummaryCatalog;
  usage: PolicyView["usage"]["budget"];
  busy: boolean;
  stage: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  const problem = rulesProblem(draft);
  if (typeof document === "undefined") return null;
  return createPortal(
    <section
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 w-[calc(100%-2rem)] max-w-sm space-y-3 rounded-lg border bg-popover p-4 shadow-lg sm:right-6"
      aria-label="Pending rule changes"
    >
      <header className="space-y-1">
        <h3 className="text-sm font-medium text-primary">
          {changes.length} unsaved {changes.length === 1 ? "change" : "changes"}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {changes.map((setting) => setting.title).join(" · ")}
        </p>
      </header>
      <Disclosure
        summary="View changes"
        className="[&>button]:rounded-sm [&>button]:focus-visible:outline-none [&>button]:focus-visible:ring-1 [&>button]:focus-visible:ring-ring"
      >
        <ul className="mt-2 max-h-[min(16rem,35dvh)] divide-y overflow-y-auto overscroll-contain">
          {changes.map((setting) => (
            <li key={setting.id} className="space-y-1.5 py-2.5 text-xs">
              <p className="font-medium">{setting.title}</p>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 leading-5">
                <div className="min-w-0 break-words text-muted-foreground [&_*]:text-muted-foreground">
                  <span className="sr-only">Current: </span>
                  <RuleChangeValue
                    id={setting.id}
                    rules={current}
                    catalog={catalog}
                    usage={usage}
                  />
                </div>
                <span aria-hidden="true" className="text-muted-foreground">
                  →
                </span>
                <div className="min-w-0 break-words font-medium text-primary">
                  <span className="sr-only">Draft: </span>
                  <RuleChangeValue id={setting.id} rules={draft} catalog={catalog} usage={usage} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Disclosure>
      <div className="space-y-3">
        {problem ? (
          <p role="alert" className="text-xs text-warning">
            {problem}
          </p>
        ) : null}
        <PolicySaveBar
          compact
          busy={busy}
          stage={stage}
          blocked={Boolean(problem) || changes.length === 0}
          onCancel={onCancel}
          onSave={onSave}
        />
      </div>
    </section>,
    document.body,
  );
}
