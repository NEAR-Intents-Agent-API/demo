import type { ReactNode } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { dialogHeaderClassName } from "./responsive-dialog-utils";

export function ResponsiveDialogHeader({
  mobile,
  title,
  description,
  headerAction,
  headerContent,
  separateHeader = false,
  descriptionClassName,
  showDrawerCloseButton,
  hideHeader = false,
}: {
  mobile: boolean;
  title: string;
  description: string;
  headerAction?: ReactNode;
  headerContent?: ReactNode;
  separateHeader?: boolean;
  descriptionClassName?: string;
  showDrawerCloseButton: boolean;
  hideHeader?: boolean;
}) {
  const Header = mobile ? DrawerHeader : DialogHeader;
  const Title = mobile ? DrawerTitle : DialogTitle;
  const Description = mobile ? DrawerDescription : DialogDescription;
  if (hideHeader) {
    return (
      <>
        <Title className="sr-only">{title}</Title>
        <Description className="sr-only">{description}</Description>
      </>
    );
  }
  return (
    <Header
      className={dialogHeaderClassName({
        mobile,
        separateHeader,
        hasContent: Boolean(headerContent),
        showClose: showDrawerCloseButton,
      })}
    >
      {headerContent ? (
        <>
          <Title className="sr-only">{title}</Title>
          <div className="min-w-0">{headerContent}</div>
        </>
      ) : headerAction ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3",
            mobile ? "text-left" : "pr-9",
          )}
        >
          <Title>{title}</Title>
          {headerAction}
        </div>
      ) : (
        <Title>{title}</Title>
      )}
      <Description className={descriptionClassName}>{description}</Description>
    </Header>
  );
}
