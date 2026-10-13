"use client";

import { useState } from "react";
import {
  type AccessDuration,
  type AccessProblems,
  accessExpiryMs,
  accessProblems,
  DEFAULT_ACCESS_LABEL,
} from "./access-form-utils";

export type AccessRequest = { label: string; expiresAt: string };

export function useAccessForm() {
  const [label, setLabel] = useState(DEFAULT_ACCESS_LABEL);
  const [duration, setDuration] = useState<AccessDuration>(7);
  const [custom, setCustom] = useState("");
  const [problems, setProblems] = useState<AccessProblems | null>(null);

  /** The request to sign, or null after showing why the form cannot be signed yet. */
  const request = (): AccessRequest | null => {
    const now = Date.now();
    const found = accessProblems({ label, duration, custom }, now);
    setProblems(found);
    if (found.label || found.expiry) return null;
    return {
      label: label.trim(),
      expiresAt: new Date(accessExpiryMs(duration, custom, now)).toISOString(),
    };
  };

  return {
    label,
    setLabel: (next: string) => {
      setLabel(next);
      setProblems(null);
    },
    duration,
    setDuration: (next: AccessDuration) => {
      setDuration(next);
      setProblems(null);
    },
    custom,
    setCustom: (next: string) => {
      setCustom(next);
      setProblems(null);
    },
    problems,
    request,
  };
}
