"use client";

import { Cancel01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/shared/identifiers";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type ClaimDraft,
  claimDraft,
  ISSUER_PRESETS,
  type IssuerPresetId,
  issuerIsEditable,
  type OidcDraft,
  presetById,
  type WorkloadProblems,
} from "./workload-grant-form-utils";

/** The issuer, the claims that pin one workload, and the audience its tokens must carry. */
export function WorkloadOidcFields({
  draft,
  onChange,
  problems,
  audience,
  busy,
}: {
  draft: OidcDraft;
  onChange: (next: OidcDraft) => void;
  problems: WorkloadProblems;
  /** What the workload requests its token for; the API fills it in for every issuer but Entra ID. */
  audience: string;
  busy: boolean;
}) {
  const preset = presetById(draft.preset);
  const choose = (id: IssuerPresetId) => {
    const next = presetById(id);
    onChange({
      ...draft,
      preset: id,
      issuer: next.issuer,
      claims: next.claims.map((name) => claimDraft(name)),
    });
  };
  const setClaim = (id: number, patch: Partial<ClaimDraft>) =>
    onChange({
      ...draft,
      claims: draft.claims.map((claim) => (claim.id === id ? { ...claim, ...patch } : claim)),
    });
  const addClaim = (name = "") =>
    onChange({ ...draft, claims: [...draft.claims, claimDraft(name)] });
  const pinned = new Set(draft.claims.map((claim) => claim.name.trim()));

  return (
    <div className="flex flex-col gap-4">
      <OptionSelect
        label="Platform"
        value={draft.preset}
        onChange={choose}
        disabled={busy}
        options={ISSUER_PRESETS.map(({ id, label }) => ({ value: id, label }))}
      />

      <Field data-invalid={Boolean(problems.issuer)}>
        <FieldLabel htmlFor="workload-issuer">Issuer</FieldLabel>
        <Input
          id="workload-issuer"
          value={issuerIsEditable(draft.preset) ? draft.issuer : preset.issuer}
          onChange={(event) => onChange({ ...draft, issuer: event.target.value })}
          readOnly={!issuerIsEditable(draft.preset)}
          disabled={busy}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={Boolean(problems.issuer)}
          placeholder="https://issuer.example.com"
        />
        <FieldError>{problems.issuer}</FieldError>
      </Field>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Pinned claims</p>
        <p className="text-xs leading-5 text-muted-foreground">{preset.hint}</p>
        {draft.claims.map((claim) => (
          <div key={claim.id} className="flex items-center gap-2">
            <Input
              aria-label="Claim name"
              value={claim.name}
              onChange={(event) => setClaim(claim.id, { name: event.target.value })}
              disabled={busy}
              spellCheck={false}
              autoComplete="off"
              placeholder="claim"
              className="min-w-0 flex-1"
            />
            <Input
              aria-label={`Value of ${claim.name || "claim"}`}
              value={claim.value}
              onChange={(event) => setClaim(claim.id, { value: event.target.value })}
              disabled={busy}
              spellCheck={false}
              autoComplete="off"
              placeholder="exact value"
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${claim.name || "claim"}`}
              disabled={busy}
              onClick={() =>
                onChange({ ...draft, claims: draft.claims.filter((item) => item.id !== claim.id) })
              }
            >
              <HugeiconsIcon icon={Cancel01Icon} />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {preset.suggestions
            .filter((name) => !pinned.has(name))
            .map((name) => (
              <Button
                key={name}
                type="button"
                variant="outline"
                size="xs"
                disabled={busy}
                onClick={() => addClaim(name)}
              >
                <HugeiconsIcon icon={PlusSignIcon} />
                {name}
              </Button>
            ))}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={busy}
            onClick={() => addClaim()}
          >
            <HugeiconsIcon icon={PlusSignIcon} />
            Other claim
          </Button>
        </div>
        {problems.claims ? (
          <p role="alert" className="text-sm text-destructive">
            {problems.claims}
          </p>
        ) : null}
      </div>

      {draft.preset === "entra" ? (
        <Field data-invalid={Boolean(problems.audience)}>
          <FieldLabel htmlFor="workload-audience">Audience</FieldLabel>
          <Input
            id="workload-audience"
            value={draft.audience}
            onChange={(event) => onChange({ ...draft, audience: event.target.value })}
            disabled={busy}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={Boolean(problems.audience)}
            placeholder="api://… or the app registration's client id"
          />
          <FieldDescription>
            Entra ID issues tokens only for audiences registered in your tenant, so this grant names
            it. Use an app registration dedicated to this API.
          </FieldDescription>
          <FieldError>{problems.audience}</FieldError>
        </Field>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Audience your workload must request</p>
          <div className="flex items-center gap-1">
            <code className="console-id min-w-0 flex-1 text-xs break-all">{audience}</code>
            <CopyButton value={audience} label="Copy audience" />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            The API adds it to the grant. Ask the platform for an identity token with exactly this
            audience.
          </p>
        </div>
      )}

      {draft.preset === "custom" ? (
        <Field data-invalid={Boolean(problems.jwks)}>
          <FieldLabel htmlFor="workload-jwks">Issuer signing keys (optional)</FieldLabel>
          <Textarea
            id="workload-jwks"
            value={draft.jwks}
            onChange={(event) => onChange({ ...draft, jwks: event.target.value })}
            disabled={busy}
            spellCheck={false}
            rows={4}
            aria-invalid={Boolean(problems.jwks)}
            placeholder='{"keys": [ … ]}'
            className="font-mono text-xs"
          />
          <FieldDescription>
            For an issuer the API does not know, such as a self-hosted Kubernetes cluster: its
            public JWKS. The keys are signed into the grant and frozen; if the issuer rotates them,
            revoke the grant and issue a new one.
          </FieldDescription>
          <FieldError>{problems.jwks}</FieldError>
        </Field>
      ) : null}
    </div>
  );
}
