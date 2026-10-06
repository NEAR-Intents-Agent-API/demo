import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { currentSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { figtreeLatin, figtreeLatinExt } from "./fonts";
import { siteInter, siteMono } from "./site-fonts";

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "NEAR Intents Agent API Demo",
  description: "Owner-signed agent accounts and rules for mainnet agents.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await currentSession();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtreeLatin.variable,
        figtreeLatinExt.variable,
        siteInter.variable,
        siteMono.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <Providers key={session?.userId ?? "signed-out"} userId={session?.userId ?? null}>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
