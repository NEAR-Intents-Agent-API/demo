import { redirect } from "next/navigation";
import {
  DemoFooter,
  LoginPanel,
  loginReturnTo,
  pendingAuthorizationUrl,
} from "@/features/auth/index";
import { LoginHero, NetworkStrip } from "@/features/home/index";
import { currentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, params] = await Promise.all([currentSession(), searchParams]);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value))
      value.forEach((entry) => {
        query.append(key, entry);
      });
    else if (value !== undefined) query.set(key, value);
  }
  const authorization = pendingAuthorizationUrl(query.toString());
  const returnTo = loginReturnTo(params.returnTo);
  if (session) redirect(authorization ?? returnTo);
  return (
    <main className="figma-site relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="relative mx-auto grid w-full max-w-[1440px] items-start gap-10 px-5 pt-10 sm:px-8 xl:grid-cols-[minmax(0,1fr)_492px] xl:gap-12 xl:px-[44px] xl:pt-20">
        <LoginHero />
        <LoginPanel resuming={authorization !== null} returnTo={returnTo} />
      </div>
      <section
        aria-label="Supported networks"
        className="relative mx-auto mt-14 w-full max-w-[1440px] border-t px-5 pt-[30px] sm:px-8 xl:px-[44px]"
      >
        <NetworkStrip compact />
      </section>
      <div className="relative mx-auto w-full max-w-[1440px] px-4 pb-6 md:px-8">
        <DemoFooter />
      </div>
    </main>
  );
}
