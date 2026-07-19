import type { Metadata } from "next";
import {
  Crimson_Pro,
  Nunito,
  Open_Sans,
  Urbanist,
  VT323,
  Zain,
} from "next/font/google";

import { DesignLab } from "@/components/marketing/design-lab";

/* TEMPORARY PAGE for the founder to pick a font pairing and palette.
 * Not linked from anywhere, not indexed. Delete after a choice lands:
 * this folder + design-lab.tsx + the dl-* CSS block. Candidate fonts are
 * self-hosted at build time by next/font, so the CSP stays untouched. */

const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" });
const crimson = Crimson_Pro({ subsets: ["latin"], variable: "--font-crimson", display: "swap" });
const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--font-vt323", display: "swap" });
const zain = Zain({ subsets: ["latin"], weight: ["300", "400", "700", "800"], variable: "--font-zain", display: "swap" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  title: "Design lab",
  description: "Temporary page: font pairings and colour palettes, side by side.",
  robots: { index: false, follow: false },
};

export default function DesignLabPage() {
  const fontVars = [urbanist, openSans, crimson, vt323, zain, nunito]
    .map((f) => f.variable)
    .join(" ");
  return <DesignLab fontVars={fontVars} />;
}
