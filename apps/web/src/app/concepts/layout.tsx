import type { Metadata } from "next";
import {
  Archivo,
  Fraunces,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";

import "./concepts.css";

/* Design-exploration sandbox layout. Deliberately bare: no site nav, no
 * footer, no marketing chrome. Five landing-page concepts live under here at
 * /concepts/1..5 and are not linked from the real site. noindex so a stray
 * crawl never treats a sandbox concept as the product. Each concept pins its
 * own palette on a [data-concept] wrapper (concepts.css), so this layout sets
 * no theme of its own. Fonts are loaded once here and shared across concepts. */

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

// Serif display for the kopitiam (1) and editorial (5) concepts. Soft optical
// axis for warmth; used only where a concept opts in.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
});

// Techy grotesque for the glass concept (2) numerals and the scrollytelling
// (3) kinetic type.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

// Heavy expanded display for the brutalist poster (4).
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Concept explorations · Kembali",
  robots: { index: false, follow: false },
};

export default function ConceptsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${jakarta.variable} ${fraunces.variable} ${spaceGrotesk.variable} ${archivo.variable}`}
    >
      {children}
    </div>
  );
}
