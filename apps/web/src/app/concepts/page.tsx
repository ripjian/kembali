import type { Metadata } from "next";
import Link from "next/link";

import "./index-page.css";
import { CONCEPTS } from "./content";

export const metadata: Metadata = {
  title: "Concept explorations · Kembali",
  description:
    "Five landing-page directions for Kembali. Design sandbox, not the live site.",
};

/* Index for the design-exploration sandbox. Sand canvas, pandan ink, coral
 * accents: the house Pandan palette, so the gallery itself reads as Kembali
 * before you open any single stretched concept. */
export default function ConceptsIndex() {
  return (
    <main className="cx-index" data-concept="index">
      <div className="cx-index-wrap">
        <header className="cx-index-head">
          <span className="cx-index-eyebrow">Design sandbox</span>
          <h1 className="cx-index-title">
            Ten ways Kembali could look
          </h1>
          <p className="cx-index-lede">
            Each is a full landing page with the same Kembali content, pushed
            hard in a different direction. Same brand colors underneath: coral
            for what you earn, pandan for what you do. Pick a number.
          </p>
        </header>

        <ol className="cx-index-list">
          {CONCEPTS.map((c) => (
            <li key={c.n}>
              <Link href={c.path} className="cx-index-card">
                <span className="cx-index-num">{String(c.n).padStart(2, "0")}</span>
                <span className="cx-index-body">
                  <span className="cx-index-name">{c.name}</span>
                  <span className="cx-index-label">{c.label}</span>
                </span>
                <span aria-hidden className="cx-index-arrow">
                  &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <p className="cx-index-foot">
          Not linked from the live site. Explorations only.
        </p>
      </div>
    </main>
  );
}
