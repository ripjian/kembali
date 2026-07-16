import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Kembali stores, who owns it, and how consent works. A plain-language summary built around Malaysia's PDPA.",
};

export default function PrivacyPage() {
  return (
    <>
        <section className="page-hero" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">Privacy</p>
            <h1 className="hero-title page-title" id="heroTitle">
              <span className="line"><span className="w">We</span> <span className="w">keep</span> <span className="w">what</span></span>{" "}
              <span className="line"><span className="w">a</span> <span className="w">card</span> <span className="w accent-w">needs.</span></span>
            </h1>
            <p className="hero-sub">A loyalty card does not need much. This page says
            plainly what Kembali stores, who owns it, and how consent works.</p>
          </div>
        </section>

        <section className="faq paper" data-theme="light">
          <div className="wrap">
            <p className="eyebrow reveal">The short version</p>
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">Little collected,</span>
              <span className="reveal-line">plainly handled.</span>
            </h2>
            <dl className="faq-list">
              <div className="faq-row reveal">
                <dt>What Kembali stores</dt>
                <dd>A name, a phone number, and if the customer chooses, an email and a birthday. Visits, stamps, and points sit against that profile. That is the whole record.</dd>
              </div>
              <div className="faq-row reveal">
                <dt>Marketing consent</dt>
                <dd>Off by default. Customers tick the box themselves, per channel, and can untick it any time. Malaysia's PDPA is the floor, not the ceiling.</dd>
              </div>
              <div className="faq-row reveal">
                <dt>Who owns the data</dt>
                <dd>The shop does. Every plan exports customers, transactions, and rewards as CSV, free, at any time. Leaving Kembali never costs you your regulars.</dd>
              </div>
              <div className="faq-row reveal">
                <dt>Deletion</dt>
                <dd>Customers can ask their shop to remove their profile, and the tools to export or delete a person's record ship with the product.</dd>
              </div>
              <div className="faq-row reveal">
                <dt>Where the data lives</dt>
                <dd>In one managed database with per-shop isolation enforced at the database layer. One shop can never read another shop's customers. More on the <Link href="/security">security page</Link>.</dd>
              </div>
              <div className="faq-row reveal">
                <dt>If something goes wrong</dt>
                <dd>The 2024 PDPA amendments require breach notification within 72 hours. Our incident plan is built around that clock, not added after it.</dd>
              </div>
              <div className="faq-row reveal">
                <dt>What we never do</dt>
                <dd>No selling of customer data, no ads, no card numbers. Kembali is paid by shops, so shops are who we answer to.</dd>
              </div>
            </dl>
            <p className="privacy-note mono reveal">This page is a plain-language summary. The full policy document arrives with the public launch.</p>
            <div className="rl-cta reveal">
              <p>Questions about a specific record or request? Write to us directly.</p>
              <a className="btn btn-solid" href="mailto:hello@kembali.app?subject=Privacy">Ask about privacy</a>
            </div>
          </div>
        </section>
    </>
  );
}
