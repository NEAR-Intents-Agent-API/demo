"use client";
import { useState } from "react";

export function useCreateFlow(onClose: () => void) {
  const [step, setStep] = useState<"name" | "rules">("name");
  const [editing, setEditing] = useState(false);
  const dismiss = () => {
    if (step === "rules" && editing) {
      setEditing(false);
      return;
    }
    onClose();
  };
  return { step, setStep, editing, setEditing, dismiss };
}
