"use client";
import { useEffect, useState } from "react";

const KEY = "demo.funds.moreActions";

/** Per-browser opt-in for the spending flows; Deposit is always available. */
export function useMoreActions() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      setEnabled(window.localStorage.getItem(KEY) === "1");
    } catch {
      // Storage can be blocked; the toggle still works for this visit.
    }
  }, []);
  const update = (next: boolean) => {
    setEnabled(next);
    try {
      window.localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // Not persisted.
    }
  };
  return [enabled, update] as const;
}
