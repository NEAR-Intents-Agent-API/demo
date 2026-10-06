import type { SetupStep } from "../../../agent-detail/components/setup-progress-utils";

export const CREATE_SETUP_STEPS: readonly SetupStep[] = [
  {
    id: "name",
    title: "Name",
    detail: "Choose a name for your account.",
    done: false,
    cta: "Edit account name",
  },
  {
    id: "live",
    title: "Rules",
    detail: "Review account rules and sign to activate.",
    done: false,
    cta: "Review rules and sign",
  },
  {
    id: "fund",
    title: "Funds",
    detail: "Deposit from a supported network.",
    done: false,
    cta: "Get a deposit address",
  },
  {
    id: "access",
    title: "Access",
    detail: "Choose dashboard access duration.",
    done: false,
    optional: true,
    cta: "Review and sign",
  },
  {
    id: "connect",
    title: "Connect",
    detail: "Authorize your preferred client.",
    done: false,
    cta: "Open Connect",
  },
];
