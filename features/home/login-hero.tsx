import { DesignAsset } from "@/components/shared/design-asset";
import { LoginBenefits } from "./login-benefits";

export function LoginHero() {
  return (
    <section className="contents xl:order-1 xl:flex xl:min-w-0 xl:flex-col">
      <div className="order-1 flex min-w-0 flex-col">
        <div className="mb-8 flex flex-wrap items-center gap-3 sm:gap-5 xl:mb-[60px]">
          <DesignAsset
            name="login-reference/login-brand"
            width={196}
            height={23.8819}
            alt="NEAR Intents"
            className="hidden h-auto w-40 sm:w-[196px] dark:block"
          />
          <DesignAsset
            name="login-imgGroup1-light"
            width={196}
            height={23.8819}
            alt="NEAR Intents"
            className="block h-auto w-40 sm:w-[196px] dark:hidden"
          />
          <span className="h-6 border-l" aria-hidden="true" />
          <span className="site-mono text-[10px] leading-5 tracking-[1.2px] text-muted-foreground sm:text-xs xl:text-sm">
            AGENT API
          </span>
        </div>
        <h1 className="text-[34px] leading-[1.207] font-bold tracking-[-1.1px] sm:text-[48px] xl:text-[clamp(42px,3.34vw,48px)] xl:tracking-[-1.6px]">
          A Wallet for Your AI Agent,
          <br />
          <span className="text-primary">With a Leash You Hold.</span>
        </h1>
        <p className="mt-6 text-[17px] leading-[27px] text-muted-foreground sm:text-lg xl:leading-7">
          Create a custody wallet, fund it from any network, and let an agent trade and pay within
          limits you sign. Runs on mainnet.
        </p>
      </div>
      <LoginBenefits />
    </section>
  );
}
