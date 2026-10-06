"use client";
import { nextSetupStep, type SetupStep } from "./setup-progress-utils";
import { SetupStepItem } from "./setup-step-item";

export function SetupProgress({
  steps,
  activeStepId,
  disabled = false,
}: {
  steps: readonly SetupStep[];
  activeStepId?: string;
  disabled?: boolean;
}) {
  const current = nextSetupStep(steps, activeStepId);
  const next = nextSetupStep(steps);
  return (
    <section aria-label="Set up this agent account" className="w-full min-w-0">
      <ol
        className="grid w-full min-w-0 gap-1 sm:gap-4"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, index) => (
          <li key={step.id} className="min-w-0">
            <SetupStepItem
              step={step}
              number={index + 1}
              primary={step === current}
              next={step === next}
              disabled={disabled}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}
