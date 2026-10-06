"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { filterNetworks } from "../picker-utils";
import { usePickerDialog } from "./use-picker-dialog";

export function useNetworkPicker(chains: readonly string[], onChange: (chain: string) => void) {
  const dialog = usePickerDialog(onChange);
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const filtered = useMemo(() => filterNetworks(chains, deferred), [chains, deferred]);
  const setOpen = (open: boolean) => {
    dialog.setOpen(open);
    if (!open) setQuery("");
  };
  const pick = (chain: string) => {
    dialog.pick(chain);
    setQuery("");
  };
  return { open: dialog.open, setOpen, pick, query, setQuery, filtered };
}
