import { Disclosure } from "@/components/shared/disclosure";
import type { IntentStep } from "@/features/intents";
import { SigningSummary } from "@/features/wallet";

export function SignatureDetails({ step }: { step: IntentStep | null }) {
  if (!step) return null;
  const intent = step.generated.intent;
  const payload =
    intent.standard === "nep413"
      ? intent.payload.message
      : intent.standard === "eip712" && typeof intent.payload.message.payload === "string"
        ? intent.payload.message.payload
        : JSON.stringify(intent.payload, null, 2);
  return (
    <Disclosure summary="Review exact permission being signed">
      <div className="pt-3">
        <SigningSummary owner={step.generated.signer} message={payload} />
      </div>
    </Disclosure>
  );
}
