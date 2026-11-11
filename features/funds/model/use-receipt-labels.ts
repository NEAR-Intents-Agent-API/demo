"use client";

import { useState } from "react";
import { executionNoteSchema, paymentReferenceSchema } from "@/lib/agent-api/schemas";

/**
 * The two optional words a payment can carry. `reference` is the payer's label, shared with the
 * payee through the receipt; `note` is the account's own record of why it ran. Both are trimmed
 * and sent only when filled in, and a value the API would refuse blocks the button first.
 */
export function useReceiptLabels() {
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const cleanReference = reference.trim();
  const cleanNote = note.trim();
  const referenceProblem =
    cleanReference && !paymentReferenceSchema.safeParse(cleanReference).success
      ? "1 to 128 characters, no spaces"
      : null;
  const noteProblem =
    cleanNote && !executionNoteSchema.safeParse(cleanNote).success
      ? "1 to 500 characters on one line"
      : null;
  return {
    reference,
    setReference,
    note,
    setNote,
    referenceProblem,
    noteProblem,
    /** Why the form cannot be sent yet; null when both are empty or valid. */
    problem: referenceProblem
      ? `Reference: ${referenceProblem}`
      : noteProblem && `Note: ${noteProblem}`,
    /** What joins the request, for the fields that were filled in. */
    args: {
      ...(cleanReference ? { reference: cleanReference } : {}),
      ...(cleanNote ? { note: cleanNote } : {}),
    },
    reset: () => {
      setReference("");
      setNote("");
    },
  };
}
