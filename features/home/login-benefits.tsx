import { LoginBenefitIllustration } from "./login-benefit-illustration";

const BENEFITS = [
  {
    icon: "sign",
    title: "One signature",
    body: "You set the rules once. The agent works inside them.",
  },
  {
    icon: "network",
    title: "Any network",
    body: "Fund, swap and withdraw across dozens of chains.",
  },
  {
    icon: "revoke",
    title: "Always revocable",
    body: "Turn off its access, or freeze the account, whenever you like.",
  },
] as const;

export function LoginBenefits() {
  return (
    <ul className="order-3 grid gap-6 sm:grid-cols-3 sm:grid-rows-[auto_auto_auto] sm:gap-x-0 sm:gap-y-3 sm:divide-x sm:divide-border xl:mt-9">
      {BENEFITS.map((benefit) => (
        <li
          key={benefit.title}
          className="flex min-w-0 items-center gap-4 sm:row-span-3 sm:grid sm:grid-rows-subgrid sm:items-start sm:gap-3 sm:px-4 sm:first:pl-0 xl:pr-6 xl:not-first:pl-7"
        >
          <LoginBenefitIllustration kind={benefit.icon} />
          <div className="min-w-0 sm:contents">
            <h2 className="text-lg leading-6 font-semibold">{benefit.title}</h2>
            <p className="mt-2 text-[15px] leading-6 text-muted-foreground sm:mt-0 sm:self-end">
              {benefit.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
