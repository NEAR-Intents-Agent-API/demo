import { cn } from "@/lib/utils";
import type { SetupStep } from "./setup-progress-utils";

export function SetupStepContent({ step, primary }: { step: SetupStep; primary: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "h-0.5 w-full shrink-0 rounded-full bg-muted/50",
          step.done && "bg-primary/60",
          primary && "bg-foreground",
        )}
      />
      <span className="w-full min-w-0 px-0.5 text-[10px] leading-4 font-medium whitespace-nowrap capitalize sm:text-xs sm:leading-5">
        {step.title}
      </span>
    </>
  );
}
