"use client";
import { useEffect, useState } from "react";

/**
 * The moment a cooldown ends while it is still running, otherwise `null`. A single timeout flips
 * it at the deadline, so a tab left open re-enables its buttons without any polling.
 */
export function useCooldown(availableAt: string | null): Date | null {
  const target = availableAt ? Date.parse(availableAt) : Number.NaN;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (Number.isNaN(target)) return;
    const remaining = target - Date.now();
    if (remaining <= 0) {
      setNow(Date.now());
      return;
    }
    const timer = setTimeout(() => setNow(Date.now()), remaining + 250);
    return () => clearTimeout(timer);
  }, [target]);
  return !Number.isNaN(target) && target > now ? new Date(target) : null;
}
