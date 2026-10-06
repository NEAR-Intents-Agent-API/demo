import { cn } from "@/lib/utils";

/** Equal-width steps: completion, current action and upcoming work share one visual order. */
export function StepProgress({
  label,
  steps,
  current,
}: {
  label: string;
  steps: readonly { label: string; done: boolean }[];
  current: number;
}) {
  return (
    <ol aria-label={label} className="flex gap-2">
      {steps.map((step, index) => (
        <li
          key={step.label}
          aria-current={index === current && !step.done ? "step" : undefined}
          className="flex min-w-0 flex-1 flex-col gap-2"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-1 rounded-sm",
              step.done
                ? "bg-primary"
                : index === current
                  ? "bg-foreground"
                  : "bg-muted-foreground/20",
            )}
          />
          <span
            className={cn(
              "text-xs leading-4",
              index === current ? "font-medium" : "text-muted-foreground",
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
