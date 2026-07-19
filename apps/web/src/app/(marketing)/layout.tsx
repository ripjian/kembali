import type { Metadata } from "next";

import { ShowcaseShell } from "@/components/marketing/showcase-shell";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteNav } from "@/components/marketing/site-nav";

import "./showcase.css";

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
    // theme (globals.css). Fonts are self-hosted via @font-face in
    // showcase.css. data-loading is cleared by the engine on mount.
    <div className="sc-root" data-loading="">
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
