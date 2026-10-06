import { GuideDetailRow } from "./guide-detail-row";
import { KEYS } from "./how-it-works-content";

export function KeyRoles() {
  return (
    <section
      aria-labelledby="keys-title"
      className="flex min-w-0 flex-col gap-6 border-t pt-10 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10 xl:pl-12"
    >
      <div>
        <h2 id="keys-title" className="text-[22px] leading-7 font-bold tracking-[-0.35px]">
          Ownership, Access, and Custody
        </h2>
        <p className="mt-2 text-sm leading-[22px] text-muted-foreground">
          Ownership, access, and custody are separate. Each has a different responsibility.
        </p>
      </div>
      <ul className="w-full divide-y divide-border">
        {KEYS.map((key) => (
          <GuideDetailRow key={key.title} title={key.title} asset={key.asset}>
            <p className="text-sm leading-[23px] text-muted-foreground">{key.body}</p>
          </GuideDetailRow>
        ))}
      </ul>
    </section>
  );
}
