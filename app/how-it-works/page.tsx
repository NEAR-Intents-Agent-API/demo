import { AuthenticatedShell } from "@/features/auth/index";
import { HowItWorks } from "@/features/home/index";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const session = await requireSession();
  return (
    <AuthenticatedShell session={session}>
      <HowItWorks />
    </AuthenticatedShell>
  );
}
