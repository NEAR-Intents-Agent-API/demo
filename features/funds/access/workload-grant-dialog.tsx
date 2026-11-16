"use client";

import { SecurityLockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Choice } from "@/components/shared/choice";
import { Pending } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GRANT_LABEL_MAX } from "@/lib/agent-api/access-input";
import { AccessDurationField } from "./access-duration-field";
import { type AccessRequest, useAccessForm } from "./use-access-form";
import {
  buildKeyCredential,
  buildOidcCredential,
  claimDraft,
  type OidcDraft,
  pastedKeyThumbprint,
  presetById,
  type WorkloadCredential,
  type WorkloadKind,
  type WorkloadProblems,
} from "./workload-grant-form-utils";
import { WorkloadOidcFields } from "./workload-oidc-fields";

export type WorkloadGrantRequest = AccessRequest & { credential: WorkloadCredential };

const KINDS = [
  { value: "oidc", label: "Workload identity" },
  { value: "public_key", label: "Workload key" },
] as const;

function initialOidc(): OidcDraft {
  const preset = presetById("github");
  return {
    preset: preset.id,
    issuer: preset.issuer,
    audience: "",
    claims: preset.claims.map((name) => claimDraft(name)),
    jwks: "",
  };
}

/**
 * Binds a new grant to a workload: a platform identity (OIDC) the API verifies, or a public key
 * whose private half stays on the workload. The dashboard never holds a token or a private key
 * for it; it only prepares what the owner signs.
 */
export function WorkloadGrantDialog({
  open,
  onOpenChange,
  audience,
  busy,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the workload requests its OIDC identity token for on this agent. */
  audience: string;
  busy: boolean;
  error: string | null;
  onSubmit: (request: WorkloadGrantRequest) => void;
}) {
  const form = useAccessForm("");
  const [kind, setKind] = useState<WorkloadKind>("oidc");
  const [oidc, setOidc] = useState<OidcDraft>(initialOidc);
  const [keyText, setKeyText] = useState("");
  const [problems, setProblems] = useState<WorkloadProblems>({});

  const submit = () => {
    const request = form.request();
    const built = kind === "oidc" ? buildOidcCredential(oidc) : buildKeyCredential(keyText);
    setProblems(built.problems ?? {});
    if (request && built.credential) onSubmit({ ...request, credential: built.credential });
  };
  const thumbprint = kind === "public_key" ? pastedKeyThumbprint(keyText) : null;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      busy={busy}
      title="Add a workload"
      description="Let a CI job, cloud service or server act on this account without a token it has to keep."
      footer={
        <div className="flex flex-col gap-3">
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button size="lg" className="w-full" disabled={busy} onClick={submit}>
            {busy ? <Pending /> : <HugeiconsIcon icon={SecurityLockIcon} className="size-4" />}
            {busy ? "Preparing…" : "Review and sign"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <Choice<WorkloadKind>
          label="How the workload proves itself"
          value={kind}
          onChange={(next) => {
            setKind(next);
            setProblems({});
          }}
          disabled={busy}
          className="w-full"
          options={KINDS}
        />

        <Field data-invalid={Boolean(form.problems?.label)}>
          <FieldLabel htmlFor="workload-label">Name</FieldLabel>
          <Input
            id="workload-label"
            value={form.label}
            onChange={(event) => form.setLabel(event.target.value)}
            disabled={busy}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={Boolean(form.problems?.label)}
            placeholder={kind === "oidc" ? "CI deploy bot" : "Build server"}
          />
          <FieldDescription>
            Shown when you sign and wherever this access is listed. Up to {GRANT_LABEL_MAX}{" "}
            characters.
          </FieldDescription>
          <FieldError>{form.problems?.label}</FieldError>
        </Field>

        {kind === "oidc" ? (
          <WorkloadOidcFields
            draft={oidc}
            onChange={(next) => {
              setOidc(next);
              setProblems({});
            }}
            problems={problems}
            audience={audience}
            busy={busy}
          />
        ) : (
          <Field data-invalid={Boolean(problems.key)}>
            <FieldLabel htmlFor="workload-key">Public key (JWK)</FieldLabel>
            <Textarea
              id="workload-key"
              value={keyText}
              onChange={(event) => {
                setKeyText(event.target.value);
                setProblems({});
              }}
              disabled={busy}
              spellCheck={false}
              rows={4}
              aria-invalid={Boolean(problems.key)}
              placeholder='{"kty":"OKP","crv":"Ed25519","x":"…"}'
              className="font-mono text-xs"
            />
            <FieldDescription>
              Generate the key where the workload runs and keep its private half there; this
              dashboard never sees it. Ed25519 and P-256 are supported.
            </FieldDescription>
            {thumbprint ? (
              <p className="console-id text-xs break-all text-muted-foreground">
                Thumbprint {thumbprint}
              </p>
            ) : null}
            <FieldError>{problems.key}</FieldError>
          </Field>
        )}

        <div className="border-t pt-5">
          <AccessDurationField form={form} busy={busy} />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Account rules and budgets apply to this workload as to every grant. You can revoke it from
          the access list at any time.
        </p>
      </div>
    </ResponsiveDialog>
  );
}
