import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";

// Frosted-SaaS type system (brand/DESIGN-dub.md): Inter is the workhorse —
// weight 500 with tight tracking plays the display role (Satoshi
// substitute per the reference), 400 body at 16px. JetBrains Mono only for
// technical micro-labels (the Geist Mono role). Scoped to marketing —
// /app and /admin keep Plus Jakarta Sans.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Kembali — loyalty cards your customers never lose",
  description:
    "Digital stamp cards for cafés, F&B, salons and gyms in Malaysia & SEA. Customers join from a QR in under 30 seconds — no app, no hardware. Loyalty your customers will love.",
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      // data-theme pins the light Dub-style tokens for this subtree only
      // (globals.css) — marketing is light-locked, the app/admin surfaces
      // keep dark-mode support.
      data-theme="marketing"
      className={`${inter.variable} ${jetbrains.variable} min-h-dvh bg-bg font-body text-text`}
    >
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
