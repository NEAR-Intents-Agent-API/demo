"use client";

import { AlertCircleIcon, CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import type { OperationTone } from "./operation-status";

export const TONE_ICON = {
  ok: CheckmarkCircle02Icon,
  bad: AlertCircleIcon,
  wait: Clock01Icon,
} as const;

export const TONE_STYLE: Record<OperationTone, string> = {
  ok: "text-success",
  bad: "text-destructive",
  wait: "text-warning",
  run: "text-foreground",
};
