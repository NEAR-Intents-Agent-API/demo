"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CatalogOption } from "@/features/assets";
import { AbilityRules } from "./ability-rules";
import { ApprovalRule } from "./approval-rule";
import { DestinationRules } from "./destination-rules";
import { LimitRules } from "./limit-rules";
import { PolicyControlsFields } from "./policy-controls-fields";
import type { Rules } from "./rules";
import { rulesProblem } from "./rules";
import { TokenRules } from "./token-rules";

type Catalog = { tokens: readonly CatalogOption[]; lookup: (assetId: string) => CatalogOption };

/**
 * Group related account controls; every group edits the same draft signed on submission.
 */
export function RulesEditor({
  rules,
  onChange,
  catalog,
  approvalAvailable,
  disabled,
  grouped = false,
}: {
  rules: Rules;
  onChange: (rules: Rules) => void;
  catalog: Catalog;
  /** Provider approvals need a NEAR owner; other owners do not see the option. */
  approvalAvailable: boolean;
  disabled?: boolean;
  grouped?: boolean;
}) {
  const problem = rulesProblem(rules);
  const actions = (
    <>
      <AbilityRules rules={rules} onChange={onChange} />
      <TokenRules rules={rules} onChange={onChange} catalog={catalog} />
    </>
  );
  const spending = (
    <>
      <PolicyControlsFields rules={rules} onChange={onChange} />
      <LimitRules rules={rules} onChange={onChange} catalog={catalog} />
    </>
  );
  const destinations = (
    <>
      <DestinationRules rules={rules} onChange={onChange} />
      {approvalAvailable ? <ApprovalRule rules={rules} onChange={onChange} /> : null}
    </>
  );
  return (
    <fieldset disabled={disabled} className="@container/rules flex min-w-0 flex-col gap-4">
      {grouped ? (
        <Tabs defaultValue="actions" className="min-w-0 gap-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="actions" className="px-2 text-xs sm:px-3">
              Permissions
            </TabsTrigger>
            <TabsTrigger value="spending" className="px-2 text-xs sm:px-3">
              Limits
            </TabsTrigger>
            <TabsTrigger value="destinations" className="px-2 text-xs sm:px-3">
              Destinations
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="actions"
            keepMounted
            className="flex flex-col gap-4 data-hidden:hidden"
          >
            {actions}
          </TabsContent>
          <TabsContent
            value="spending"
            keepMounted
            className="flex flex-col gap-4 data-hidden:hidden"
          >
            {spending}
          </TabsContent>
          <TabsContent
            value="destinations"
            keepMounted
            className="flex flex-col gap-4 data-hidden:hidden"
          >
            {destinations}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {actions}
          {spending}
          {destinations}
        </>
      )}
      {problem ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-muted/60 px-4 py-3 text-sm"
        >
          <HugeiconsIcon icon={Alert02Icon} className="mt-0.5 size-4 shrink-0 text-warning" />
          {problem}
        </p>
      ) : null}
    </fieldset>
  );
}
