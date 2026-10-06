import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="flex flex-col items-start gap-4 py-8">
      <h1 className="text-xl font-semibold">Agent unavailable</h1>
      <p className="text-sm text-muted-foreground">
        This account is unavailable for your current owner identity.
      </p>
      <Link href="/agents" className={buttonVariants({ variant: "outline" })}>
        Back to agent accounts
      </Link>
    </section>
  );
}
