import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell us about your shop. A real person replies within one working day.",
};

export default function ContactPage() {
  return (
    <>
        <section className="page-hero" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">Contact</p>
            <h1 className="hero-title page-title" id="heroTitle">
              <span className="line"><span className="w">Say</span> <span className="w accent-w">hello.</span></span>
            </h1>
            <p className="hero-sub">Tell us about your shop. A real person replies
            within one working day.</p>
          </div>
        </section>

        <section className="contact paper" data-theme="light">
          <div className="wrap">
            <div className="contact-grid">
              <div className="contact-main">
                <h2 className="section-title reveal-line-group">
                  <span className="reveal-line">One email</span>
                  <span className="reveal-line">starts the card.</span>
                </h2>
                <p className="reveal contact-copy">No demo call, no sales sequence. Describe your shop and we reply with a plan and a price.</p>
                <a className="btn btn-solid btn-big reveal" href="mailto:hello@kembali.app?subject=Start%20my%20card&body=Shop%20name%3A%20%0ACity%3A%20%0AOutlets%3A%20%0AWhat%20the%20reward%20should%20be%3A%20">Write to us</a>
                <p className="contact-email mono reveal">hello@kembali.app</p>
              </div>
              <aside className="contact-side reveal">
                <p className="col-label mono">Worth including</p>
                <ul className="join-facts contact-facts">
                  <li><span className="mono">01</span>Your shop's name and city</li>
                  <li><span className="mono">02</span>How many outlets you run</li>
                  <li><span className="mono">03</span>What the reward should be</li>
                </ul>
                <div className="contact-note">
                  <p className="mono">FOUNDING RATE</p>
                  <p>The first 20 shops get everything Kembali ships at RM99 per outlet, locked for a year. <Link href="/pricing">See pricing</Link>.</p>
                </div>
                <div className="contact-note">
                  <p className="mono">FOR CHAINS</p>
                  <p>Looking to develop an app for your brand? <Link href="/your-app">See what it could look like</Link>.</p>
                </div>
              </aside>
            </div>
            <div className="rl-cta reveal">
              <p>Not sure what to write? Follow the story first and see the card fill.</p>
              <Link className="btn btn-ghost" href="/story">Follow the story</Link>
            </div>
          </div>
        </section>
    </>
  );
}
