import type { Metadata } from "next";

import { BrandAppDemo } from "@/components/marketing/brand-app-demo";
import { VariantReceipt, VariantSteps } from "@/components/marketing/builder-variants";
import { PlanBuilder } from "@/components/marketing/plan-builder";

export const metadata: Metadata = {
  title: "Design options",
  description: "Temporary page: design options for the plan builder and the app demo.",
  robots: { index: false, follow: false },
};

/* TEMPORARY PAGE for the founder to pick design directions.
 * Not linked from anywhere. Delete after a choice lands:
 * this file + builder-variants.tsx + the dv/bvr/bvs/pv CSS blocks. */
export default function DesignVariantsPage() {
  return (
    <>
        <section className="page-hero" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">Temporary &middot; design options</p>
            <h1 className="hero-title page-title" id="heroTitle">
              <span className="line"><span className="w">Pick</span> <span className="w">a</span> <span className="w accent-w">direction.</span></span>
            </h1>
            <p className="hero-sub">Two sections, lettered options. Reply with the letters
            and the winners replace the live versions.</p>
          </div>
        </section>

        {/* ============ A. the plan builder ============ */}
        <section className="dv-section paper" data-theme="light">
          <div className="wrap">
            <p className="eyebrow reveal">Section A &middot; the plan builder</p>

            <div className="dv-option">
              <h2 className="dv-label">A1 &middot; Checklist and sticky total</h2>
              <p className="dv-why">What is live today. Reads like a form: quick to scan, the total follows you.</p>
              <PlanBuilder />
            </div>

            <div className="dv-option">
              <h2 className="dv-label">A2 &middot; Tap chips, watch the receipt</h2>
              <p className="dv-why">Playful and on-brand: every choice prints a ledger line, like the product itself.</p>
              <VariantReceipt />
            </div>

            <div className="dv-option">
              <h2 className="dv-label">A3 &middot; Three small steps</h2>
              <p className="dv-why">The reach-out quiz shape. Most guided, best on phones, slowest to a number.</p>
              <VariantSteps />
            </div>
          </div>
        </section>

        {/* ============ B. the app demo phone ============ */}
        <section className="dv-section dv-dark" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">Section B &middot; the app demo phone</p>
            <div className="dv-phones">
              <figure className="dv-phone">
                <div className="pv-dark"><BrandAppDemo /></div>
                <figcaption className="mono">B1 &middot; dark bezel, what is live today</figcaption>
              </figure>
              <figure className="dv-phone">
                <div className="pv-light"><BrandAppDemo /></div>
                <figcaption className="mono">B2 &middot; light titanium bezel, softer</figcaption>
              </figure>
              <figure className="dv-phone">
                <div className="pv-frameless"><BrandAppDemo /></div>
                <figcaption className="mono">B3 &middot; no hardware, just the app floating</figcaption>
              </figure>
            </div>
            <p className="dv-foot mono">Temporary page, linked from nowhere. Reply with one A and one B.</p>
          </div>
        </section>
    </>
  );
}
