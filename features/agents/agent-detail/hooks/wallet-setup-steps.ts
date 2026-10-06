import type { SetupStep } from "../components/setup-progress-utils";

export function walletSetupSteps({
  funded,
  hasAccess,
  hasClient,
  onDeposit,
  onEnableAccess,
  onConnect,
  onActivated,
}: {
  funded: boolean;
  hasAccess: boolean;
  hasClient: boolean;
  onDeposit: () => void;
  onEnableAccess: () => void;
  onConnect: () => void;
  onActivated?: () => void;
}) {
  const steps: SetupStep[] = [
    {
      id: "name",
      title: "Name",
      detail: "Account name saved.",
      done: true,
      cta: "Account named",
    },
    {
      id: "live",
      title: "Rules",
      detail: "Ownership and account rules.",
      done: true,
      onClick: onActivated,
      cta: "View activation",
    },
    {
      id: "fund",
      title: "Funds",
      detail: "Deposit from a supported network.",
      done: funded,
      onClick: onDeposit,
      cta: "Get a deposit address",
    },
    {
      id: "access",
      optional: true,
      title: "Access",
      detail: "Choose dashboard access duration.",
      done: hasAccess,
      onClick: onEnableAccess,
      cta: "Review and sign",
    },
    {
      id: "connect",
      title: "Connect",
      detail: "Authorize your preferred client.",
      done: hasClient,
      onClick: onConnect,
      cta: "Open Connect",
    },
  ];
  return steps;
}
