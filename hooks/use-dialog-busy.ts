"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { DialogBusyContext } from "@/components/shared/dialog-busy-context";

export function useDialogBusy(busy: boolean) {
  const setBusy = useContext(DialogBusyContext)?.setBusy;
  useEffect(() => {
    setBusy?.(busy);
    return () => setBusy?.(false);
  }, [busy, setBusy]);
}

export function useDialogLocked() {
  return useContext(DialogBusyContext)?.busy ?? false;
}

export function useDialogBusyTarget(busy: boolean) {
  const [childBusy, setChildBusy] = useState(false);
  const locked = busy || childBusy;
  const value = useMemo(() => ({ busy: locked, setBusy: setChildBusy }), [locked]);
  return { locked, value };
}
