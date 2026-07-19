import type { Metadata } from "next";
import { Nunito, Zain } from "next/font/google";

import { ShowcaseShell } from "@/components/marketing/showcase-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";

import "./showcase.css";

/* Zain + Nunito (founder pick, 2026-07-19), self-hosted at build by
 * next/font so the CSP stays untouched. IBM Plex Mono remains the
 * ledger voice via @font-face in showcase.css. */
const zain = Zain({
  subsets: ["latin"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-zain",
  display: "swap",
});
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Kembali: loyalty cards your customers never lose",
    template: "%s · Kembali",
  },
  description:
    "Digital stamp cards for cafes, restaurants, salons, gyms and car washes in Malaysia. Customers join from a QR in under 30 seconds. No app, no hardware.",
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // .sc-root scopes the whole showcase design system: the reset, tokens
    // and base element styles stop here, so /app and /admin keep their own
    // theme (globals.css). data-loading is cleared by the engine on mount.
    <div className={`sc-root ${zain.variable} ${nunito.variable}`} data-loading="">
      <div className="loader" id="loader" aria-hidden>
        <div className="loader-stamp">
          <svg viewBox="0 0 96 96" className="loader-mark">
            <circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="10" />
            <circle cx="48" cy="48" r="12" className="loader-dot" />
          </svg>
        </div>
      </div>

      <SiteNav />
      {children}
      <SiteFooter />
      <ShowcaseShell />
    </div>
  );
}
