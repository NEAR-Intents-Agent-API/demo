import { DesignAsset } from "@/components/shared/design-asset";

export function LoginBenefitIllustration({ kind }: { kind: "sign" | "network" | "revoke" }) {
  return (
    <div
      className="relative h-[76px] w-[82px] shrink-0 sm:h-[116px] sm:w-[123px]"
      aria-hidden="true"
    >
      <div className="relative h-[172px] w-[182px] origin-top-left scale-[0.45] sm:scale-[0.675]">
        <DesignAsset
          name={`login-reference/login-benefit-${kind}`}
          width={160}
          height={160}
          className="absolute top-0 left-4 hidden dark:block"
        />
        <DesignAsset
          name={`login-reference/login-benefit-${kind}-light`}
          width={160}
          height={160}
          className="absolute top-0 left-4 dark:hidden"
        />
        {kind === "network" ? (
          <DesignAsset
            name="login-reference/login-benefit-near"
            width={29.1667}
            height={29.1667}
            className="absolute top-[67.784px] left-[81.417px]"
          />
        ) : null}
      </div>
    </div>
  );
}
