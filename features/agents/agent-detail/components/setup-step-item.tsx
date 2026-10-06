"use client";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type SetupStep, setupStepStatus } from "./setup-progress-utils";
import { SetupStepContent } from "./setup-step-content";

export function SetupStepItem({
  step,
  number,
  primary = false,
  next = false,
  disabled = false,
}: {
  step: SetupStep;
  number: number;
  primary?: boolean;
  next?: boolean;
  disabled?: boolean;
}) {
  const actionable = Boolean(step.href || step.onClick);
  const status = setupStepStatus(step, primary, next);
  const ariaLabel = `Step ${number}. ${step.title}: ${status}. ${step.cta}${step.optional ? " (optional)" : ""}`;
  const className = cn(
    "flex h-auto min-h-10 w-full min-w-0 flex-col items-center justify-start gap-2 rounded-none p-0 text-center whitespace-normal hover:bg-transparent dark:hover:bg-transparent",
    primary
      ? "text-foreground hover:text-foreground"
      : "text-muted-foreground hover:text-foreground",
    disabled && actionable && "pointer-events-none opacity-60",
  );
  const content = <SetupStepContent step={step} primary={primary} />;
  if (!actionable || disabled)
    return (
      <div
        className={className}
        title={step.detail}
        aria-current={primary ? "step" : undefined}
        aria-disabled={actionable && disabled}
      >
        <span className="sr-only">{ariaLabel}</span>
        <span aria-hidden="true" className="contents">
          {content}
        </span>
      </div>
    );
  return step.href ? (
    <Link
      href={step.href}
      title={step.detail}
      aria-label={ariaLabel}
      aria-current={primary ? "step" : undefined}
      className={cn(buttonVariants({ variant: "ghost" }), className)}
    >
      {content}
    </Link>
  ) : (
    <Button
      variant="ghost"
      className={className}
      title={step.detail}
      onClick={step.onClick}
      aria-label={ariaLabel}
      aria-current={primary ? "step" : undefined}
    >
      {content}
    </Button>
  );
}
