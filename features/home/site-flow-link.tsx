import { DesignAsset } from "@/components/shared/design-asset";

export function SiteFlowLink({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-4 py-2 xl:flex-col xl:gap-2 xl:py-0">
      <DesignAsset
        name="guide-imgNearIntentsDemoProcessConnector"
        width={64}
        height={12}
        className="rotate-90 xl:rotate-0"
      />
      <p className="w-16 text-center text-[11px] leading-4">{label}</p>
    </div>
  );
}
