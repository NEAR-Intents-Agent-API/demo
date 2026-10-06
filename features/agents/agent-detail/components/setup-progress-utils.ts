export type SetupStep = {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  optional?: boolean;
  onClick?: () => void;
  href?: string;
  cta: string;
};

export function nextSetupStep(steps: readonly SetupStep[], activeStepId?: string) {
  const active = steps.find((step) => step.id === activeStepId);
  if (active) return active;
  return steps.find((step) => !step.done && !step.optional) ?? null;
}

export function setupStepStatus(step: SetupStep, selected: boolean, next: boolean) {
  if (step.done) return "Completed";
  if (selected) return "Current";
  if (next) return "Next";
  return step.optional ? "Optional" : "Not started";
}

/** Optional permissions never keep the required setup progress below complete. */
export function setupProgressCounts(steps: readonly SetupStep[]) {
  const required = steps.filter((step) => !step.optional);
  const optional = steps.filter((step) => step.optional);
  return { required, optional, completed: required.filter((step) => step.done).length };
}
