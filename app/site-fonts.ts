import localFont from "next/font/local";

export const siteInter = localFont({
  src: [
    { path: "./fonts/inter-400.ttf", weight: "400" },
    { path: "./fonts/inter-500.ttf", weight: "500" },
    { path: "./fonts/inter-700.ttf", weight: "700" },
  ],
  display: "swap",
  preload: false,
  variable: "--font-site-inter",
});

export const siteMono = localFont({
  src: "./fonts/ibm-plex-mono-400.ttf",
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-site-mono",
});
