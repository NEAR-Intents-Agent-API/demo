"use client";
import type { ReactNode, RefObject } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ResponsiveDialogHeader } from "./responsive-dialog-header";
import { dialogContentClassName } from "./responsive-dialog-utils";
import { ResponsiveDrawerClose } from "./responsive-drawer-close";

/**
 * One overlay shape for the whole app: Drawer on mobile, Dialog on desktop.
 *
 * The title and description stay pinned while the body scrolls, and actions live in `footer`,
 * outside the scroll area. A body never needs its own sticky bar, so content can never hide
 * under the buttons.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  contentClassName,
  bodyClassName,
  headerAction,
  headerContent,
  separateHeader = false,
  descriptionClassName,
  hideHeader = false,
  hideWhenNested = false,
  returnFocus,
  showDrawerCloseButton = false,
  busy = false,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  /** Pinned action row below the scrollable body; the dialog's primary controls. */
  footer?: ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
  headerAction?: ReactNode;
  headerContent?: ReactNode;
  /** A separate 50px toolbar above the content card. */
  separateHeader?: boolean;
  descriptionClassName?: string;
  hideHeader?: boolean;
  /** Keep form state mounted while a nested picker replaces this overlay. */
  hideWhenNested?: boolean;
  returnFocus?: RefObject<HTMLElement | null>;
  showDrawerCloseButton?: boolean;
  busy?: boolean;
}) {
  const mobile = useIsMobile();
  const changeOpen = (value: boolean) => {
    if (!busy) onOpenChange(value);
  };
  const header = (
    <ResponsiveDialogHeader
      mobile={mobile}
      title={title}
      description={description}
      headerAction={headerAction}
      headerContent={headerContent}
      separateHeader={separateHeader}
      descriptionClassName={descriptionClassName}
      hideHeader={hideHeader}
      showDrawerCloseButton={showDrawerCloseButton}
    />
  );
  return mobile ? (
    <Drawer open={open} onOpenChange={changeOpen}>
      <DrawerContent
        className={cn(
          "rounded-xl",
          hideWhenNested && "data-nested-drawer-open:invisible",
          separateHeader && "rounded-none border-0 bg-transparent shadow-none",
        )}
        finalFocus={returnFocus}
      >
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]",
            separateHeader && "gap-3",
          )}
        >
          {header}
          {showDrawerCloseButton && !busy ? (
            <ResponsiveDrawerClose
              compactHeader={Boolean(headerContent || hideHeader)}
              separateHeader={separateHeader}
            />
          ) : null}
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4",
              separateHeader && "rounded-xl border bg-popover pt-14",
              bodyClassName,
            )}
          >
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 bg-popover px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        finalFocus={returnFocus}
        showCloseButton={!busy}
        className={dialogContentClassName({
          contentClassName,
          hideWhenNested,
          separateHeader,
          compactHeader: Boolean(headerContent || hideHeader),
        })}
      >
        {header}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5",
            separateHeader && "rounded-xl border bg-popover pt-14",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? <div className="shrink-0 px-6 pb-5 pt-3">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
