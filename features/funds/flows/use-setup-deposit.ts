"use client";

import { useContext } from "react";
import { SetupNavigationContext } from "@/components/shared/setup-navigation-context";
import { useDialogLocked } from "@/hooks/use-dialog-busy";
import { FlowFooterContext } from "./flow-footer-context";

export function useSetupDeposit(busy: boolean) {
  const navigation = useContext(SetupNavigationContext);
  const flowFooterTarget = useContext(FlowFooterContext);
  const locked = useDialogLocked();
  return { navigation, flowFooterTarget, disabled: busy || locked };
}
