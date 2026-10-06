import { cn } from "@/lib/utils";

export function dialogHeaderClassName({
  mobile,
  separateHeader,
  hasContent,
  showClose,
}: {
  mobile: boolean;
  separateHeader: boolean;
  hasContent: boolean;
  showClose: boolean;
}) {
  if (separateHeader) return "shrink-0 p-0";
  if (mobile) return cn(hasContent ? "pt-14" : showClose && "pr-14");
  return cn("shrink-0 px-6 pb-3", hasContent ? "pt-14" : "pt-6");
}

export function dialogContentClassName({
  contentClassName,
  hideWhenNested,
  separateHeader,
  compactHeader,
}: {
  contentClassName?: string;
  hideWhenNested: boolean;
  separateHeader: boolean;
  compactHeader: boolean;
}) {
  return cn(
    "flex max-h-[min(46rem,calc(100dvh-3rem))] flex-col gap-0 overflow-hidden rounded-xl border p-0",
    contentClassName ?? "sm:max-w-xl",
    hideWhenNested && "data-nested-dialog-open:invisible",
    separateHeader && "gap-3 rounded-none border-0 bg-transparent shadow-none ring-0",
    compactHeader && "[&>[data-slot=dialog-close]]:right-3 [&>[data-slot=dialog-close]]:top-3",
    separateHeader && "[&>[data-slot=dialog-close]]:top-[74px]",
  );
}
