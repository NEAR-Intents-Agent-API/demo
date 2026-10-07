"use client";
import { useState } from "react";
import type { DepositSource } from "./deposit-source-options";
import { type DepositTracking, useDepositForm } from "./use-deposit-form";

export function useDepositFlow() {
  const [source, setSource] = useState<DepositSource>("network");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [tracking, setTracking] = useState<DepositTracking | null>(null);
  const form = useDepositForm(setTracking);
  const pickSource = (next: DepositSource) => {
    setSource(next);
    setSourceOpen(false);
  };
  const finish = () => {
    setTracking(null);
    form.reset();
  };
  return { source, pickSource, sourceOpen, setSourceOpen, tracking, form, finish };
}
