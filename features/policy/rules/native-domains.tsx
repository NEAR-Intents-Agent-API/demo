"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { domainKey, type TypedDataDomain, typedDataDomainSchema } from "@/lib/agent-api/schemas";
import { domainLabel } from "./native";
import { NativeEntries } from "./native-list";

const FIELDS = [
  { key: "name", label: "Name", placeholder: "Exchange" },
  { key: "version", label: "Version", placeholder: "1" },
  { key: "chainId", label: "Chain id", placeholder: "1337" },
  { key: "contract", label: "Verifying contract", placeholder: "0x…" },
] as const;
type Draft = Record<(typeof FIELDS)[number]["key"], string>;
const emptyDraft: Draft = { name: "", version: "", chainId: "", contract: "" };

/** The typed fields as a domain: only what was filled in, the contract lowercased. */
function domainFromDraft(draft: Draft): Record<string, unknown> {
  const name = draft.name.trim();
  const version = draft.version.trim();
  const chainId = draft.chainId.trim();
  const contract = draft.contract.trim().toLowerCase();
  return {
    ...(name ? { name } : {}),
    ...(version ? { version } : {}),
    ...(chainId ? { chain_id: /^[0-9]{1,16}$/.test(chainId) ? Number(chainId) : chainId } : {}),
    ...(contract ? { verifying_contract: contract } : {}),
  };
}

/**
 * EIP-712 domains the agent may sign typed data under. A request's domain must equal one entry
 * field for field, so each entry names exactly the fields the service's domain carries.
 */
export function NativeDomains({
  value,
  onChange,
}: {
  value: readonly TypedDataDomain[];
  onChange: (value: TypedDataDomain[]) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const add = () => {
    const parsed = typedDataDomainSchema.safeParse(domainFromDraft(draft));
    if (!parsed.success) {
      setError(
        `${parsed.error.issues[0]?.message ?? "Invalid domain"}. Fill in the fields the service's domain uses.`,
      );
      return;
    }
    if (value.some((domain) => domainKey(domain) === domainKey(parsed.data))) {
      setError("This domain is already listed.");
      return;
    }
    onChange([...value, parsed.data]);
    setDraft(emptyDraft);
    setError(null);
  };
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Sign typed data for these domains</p>
      <p className="text-xs leading-5 text-muted-foreground">
        EIP-712, such as Hyperliquid&rsquo;s Exchange domain. A request must match a listed domain
        field for field; leave out the fields the domain does not have.
      </p>
      <div className="grid gap-2 @md/rules:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`${id}-${field.key}`} className="text-xs">
              {field.label}
            </Label>
            <Input
              id={`${id}-${field.key}`}
              value={draft[field.key]}
              placeholder={field.placeholder}
              spellCheck={false}
              inputMode={field.key === "chainId" ? "numeric" : undefined}
              onChange={(event) => {
                setDraft({ ...draft, [field.key]: event.target.value });
                setError(null);
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={!Object.values(draft).some((field) => field.trim())}
        >
          Add domain
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      <NativeEntries
        entries={value.map(domainLabel)}
        empty="No domains: typed data signing is off."
        onRemove={(index) => onChange(value.filter((_, position) => position !== index))}
      />
    </div>
  );
}
