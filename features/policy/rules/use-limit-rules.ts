"use client";
import { useState } from "react";
import type { CatalogOption } from "@/features/assets";
import type { Rules, TokenLimit } from "./rules";

export function useLimitRules(
  rules: Rules,
  onChange: (rules: Rules) => void,
  catalog: { tokens: readonly CatalogOption[] },
) {
  const [picking, setPicking] = useState(false);
  const limited = new Set(rules.limits.map((limit) => limit.assetId));
  const choices = catalog.tokens.filter(
    (token) =>
      !limited.has(token.assetId) &&
      (rules.tokens === "any" || rules.tokens.includes(token.assetId)),
  );
  const setLimits = (limits: TokenLimit[]) => onChange({ ...rules, limits });
  return { picking, setPicking, choices, setLimits };
}
