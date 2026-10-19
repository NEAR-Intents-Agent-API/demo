"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** A short list of exact entries; empty means the method is off. */
export function NativeEntries({
  entries,
  empty,
  onRemove,
}: {
  entries: readonly string[];
  empty: string;
  onRemove: (index: number) => void;
}) {
  if (!entries.length) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y border-y">
      {entries.map((entry, index) => (
        <li key={entry} className="flex items-center gap-3 py-2">
          <span className="console-id min-w-0 flex-1 text-xs break-all">{entry}</span>
          <Button type="button" variant="ghost" size="xs" onClick={() => onRemove(index)}>
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}

/**
 * NEAR accounts a native method may target, typed one at a time. `problem` names why an entry
 * cannot be added (malformed, a duplicate, a NEAR Intents contract), or null to accept it.
 */
export function NativeAccountList({
  label,
  description,
  placeholder,
  empty,
  value,
  problem,
  onChange,
}: {
  label: string;
  description: string;
  placeholder: string;
  empty: string;
  value: readonly string[];
  problem: (account: string) => string | null;
  onChange: (value: string[]) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const add = () => {
    const account = draft.trim().toLowerCase();
    const reason = problem(account);
    setError(reason);
    if (reason) return;
    onChange([...value, account]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            add();
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <NativeEntries
        entries={value}
        empty={empty}
        onRemove={(index) => onChange(value.filter((_, position) => position !== index))}
      />
    </div>
  );
}
