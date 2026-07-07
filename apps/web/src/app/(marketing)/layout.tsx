import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";

// Editorial pairing (brand/DESIGN-Monad.md): the serif announces, the mono
// instructs. Fraunces is the brand display serif (BRAND.md §4); JetBrains
// Mono stands in for ABC Diatype Mono. Scoped to the marketing surface —
// /app and /admin keep Plus Jakarta Sans.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Kembali — loyalty cards your customers never lose",
  description:
    "Digital stamp cards for cafés, F&B, salons and gyms in Malaysia & SEA. Customers join from a QR in under 30 seconds — no app, no hardware. Make them come back.",
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      // data-theme pins the light Pandan tokens for this subtree only
      // (globals.css) — marketing is light-locked, the app/admin surfaces
      // keep dark-mode support.
      data-theme="marketing"
      className={`${fraunces.variable} ${jetbrains.variable} min-h-dvh bg-bg font-mono text-text`}
    >
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
