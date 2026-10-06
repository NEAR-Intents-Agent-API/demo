import { DialogFooter } from "./dialog-footer";
import { Panel } from "./page";

export function SetupFlowPanel({
  step,
  title,
  description,
  children,
  footer,
  optional = false,
  plain = false,
  hideHeading = false,
}: {
  step: number;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  optional?: boolean;
  plain?: boolean;
  hideHeading?: boolean;
}) {
  return (
    <Panel
      plain={plain}
      className="w-full max-w-3xl"
      title={
        title && !hideHeading ? (
          <span className="flex flex-col gap-2">
            {!plain ? <span className="console-eyebrow">Step {step} of 5</span> : null}
            <span className="flex items-center gap-2">
              <span className="text-lg font-medium tracking-tight">{title}</span>
              {optional ? (
                <span className="text-xs font-normal text-muted-foreground">Optional</span>
              ) : null}
            </span>
          </span>
        ) : undefined
      }
      description={description}
      bodyClassName="flex flex-col gap-5"
    >
      {hideHeading && (description || optional) ? (
        <div className="space-y-2">
          {optional ? <p className="text-xs text-muted-foreground">Optional</p> : null}
          {description ? (
            <p className="text-xs leading-5 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
      {footer ? (
        <DialogFooter>
          <div className="grid w-full auto-cols-fr grid-flow-col items-stretch gap-3 border-t pt-4 [&>button]:h-auto [&>button]:min-h-11 [&>button]:min-w-0 [&>button]:w-full [&>button]:whitespace-normal">
            {footer}
          </div>
        </DialogFooter>
      ) : null}
    </Panel>
  );
}
