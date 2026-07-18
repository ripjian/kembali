import type { Metadata } from "next";
import Link from "next/link";

import { BrandAppDemo } from "@/components/marketing/brand-app-demo";

export const metadata: Metadata = {
  title: "Your own app",
  description:
    "For chains: the Kembali loyalty experience as an app under your brand's name and icon. See an interactive demo.",
};

/* Deliberately quiet: this page is linked from the pricing FAQ, the plan
 * builder and the contact page, not from the nav or footer. */
export default function YourAppPage() {
  return (
    <>
        {/* ================= PAGE HERO ================= */}
        <section className="page-hero" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">For chains</p>
            <h1 className="hero-title page-title" id="heroTitle">
              <span className="line"><span className="w">Your</span> <span className="w">brand,</span></span>{" "}
              <span className="line"><span className="w">on</span> <span className="w">their</span> <span className="w accent-w">home&nbsp;screen.</span></span>
            </h1>
            <p className="hero-sub">The same loyalty your counters already run, as an app
            under your name and icon. The web card stays for everyone else.</p>
          </div>
        </section>

        {/* ================= DEMO ================= */}
        <section className="ya-demo paper" data-theme="light">
          <div className="wrap ya-grid">
            <div className="ya-phone reveal">
              <BrandAppDemo />
              <p className="ya-hint mono">This demo works. Tap the tabs, show the QR, redeem a reward.</p>
            </div>
            <div className="ya-copy">
              <p className="eyebrow reveal">A working sketch</p>
              <h2 className="section-title reveal-line-group">
                <span className="reveal-line">Every screen is</span>
                <span className="reveal-line">already your flow.</span>
              </h2>
              <p className="reveal">Nothing here is new product. The card, the QR, points
              and the timed reward coupon are the flows your customers use today, dressed
              in your colours and living behind your icon.</p>
              <ul className="join-facts">
                <li className="reveal"><span className="mono">01</span>Your icon, your name in both app stores</li>
                <li className="reveal"><span className="mono">02</span>Push messages instead of paper reminders</li>
                <li className="reveal"><span className="mono">03</span>Same counter flow, nothing new for staff</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================= TERMS ================= */}
        <section className="ya-terms" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">The honest part</p>
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">Built for chains,</span>
              <span className="reveal-line">priced on a call.</span>
            </h2>
            <ul className="ya-facts">
              <li className="reveal"><strong>Six outlets or more.</strong> An app earns its place on a phone when the brand is part of the routine. Smaller shops do better on the web card.</li>
              <li className="reveal"><strong>Top plan only.</strong> The app builds on everything in Growth, so it starts there.</li>
              <li className="reveal"><strong>Your own store accounts.</strong> Apple requires branded apps to ship from the brand's own developer account. We handle the builds and the listings, the accounts stay yours.</li>
            </ul>
            <div className="hero-actions">
              <a className="btn btn-solid reveal" href="mailto:hello@kembali.app?subject=An%20app%20for%20our%20brand&body=Brand%3A%20%0AOutlets%3A%20%0ACities%3A%20">Ask about your app</a>
              <Link className="btn btn-ghost reveal" href="/pricing#custom">Build your plan first</Link>
            </div>
          </div>
        </section>
    </>
  );
}
