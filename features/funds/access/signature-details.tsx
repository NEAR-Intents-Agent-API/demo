import { Disclosure } from "@/components/shared/disclosure";
import type { IntentStep } from "@/features/intents";
import { SigningSummary } from "@/features/wallet";
import { signedPayloadText } from "./signature-utils";

export function SignatureDetails({ step }: { step: IntentStep | null }) {
  if (!step) return null;
  const payload = signedPayloadText(step.generated.intent);
  return (
    <Disclosure summary="Review exact permission being signed">
      <div className="pt-3">
        <SigningSummary owner={step.generated.signer} message={payload} />
      </div>
    </Disclosure>
  );
}
