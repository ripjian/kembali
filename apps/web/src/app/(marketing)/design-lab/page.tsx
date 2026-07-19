import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Crimson_Pro,
  DM_Sans,
  DM_Serif_Display,
  Figtree,
  Inter,
  Nunito,
  Open_Sans,
  Playfair_Display,
  Source_Sans_3,
  Space_Grotesk,
  Space_Mono,
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
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-playfair", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-dm-serif", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: "Design lab",
  description: "Temporary page: font pairings and colour palettes, side by side.",
  robots: { index: false, follow: false },
};

export default function DesignLabPage() {
  const fontVars = [
    urbanist, openSans, crimson, vt323, zain, nunito,
    playfair, sourceSans, spaceGrotesk, inter, spaceMono, dmSerif, dmSans, bricolage, figtree,
  ]
    .map((f) => f.variable)
    .join(" ");
  return <DesignLab fontVars={fontVars} />;
}
