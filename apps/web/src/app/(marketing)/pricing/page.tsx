import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One price per outlet, billed monthly by invoice. Founding merchants pay RM99 with the rate locked for a year.",
};

export default function PricingPage() {
  return (
    <>
        {/* ================= PAGE HERO ================= */}
        <section className="page-hero" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">Pricing</p>
            <h1 className="hero-title page-title" id="heroTitle">
              <span className="line"><span className="w">One</span> <span className="w">price</span></span>{" "}
              <span className="line"><span className="w">per</span> <span className="w accent-w">outlet.</span></span>
            </h1>
            <p className="hero-sub">Billed monthly by invoice, in ringgit. No card reader,
            no contract, no charge until your card is live.</p>
          </div>
        </section>

        {/* ================= PLANS ================= */}
        <section className="plans" id="plans" data-theme="dark">
          <div className="wrap">
            <div className="plan-grid">

              <article className="plan plan-hero reveal">
                <div className="plan-flag mono">Available now · first 20 shops</div>
                <h2 className="plan-name">Founding merchant</h2>
                <p className="plan-price"><span className="price">RM99</span><span className="plan-per mono">/outlet/month</span></p>
                <ul className="plan-list">
                  <li>Everything Kembali ships, as it ships, no plan change ever</li>
                  <li>30-day free pilot before the first invoice</li>
                  <li>Rate locked for 12 months</li>
                  <li>Stamp cards, points and rewards, QR kit, team roles, reports</li>
                  <li>Free data export, always</li>
                </ul>
                <a className="btn btn-solid" href="mailto:hello@kembali.app?subject=Founding%20merchant">Become a founding merchant</a>
                <div className="plan-stamp mono" aria-hidden="true">Founding<br />rate</div>
              </article>

              <article className="plan reveal">
                <div className="plan-flag plan-flag-muted mono">At launch</div>
                <h2 className="plan-name">Starter</h2>
                <p className="plan-price"><span className="price price-muted">RM149</span><span className="plan-per mono">/outlet/month</span></p>
                <ul className="plan-list">
                  <li>Digital stamp card and QR scan to stamp</li>
                  <li>Points and rewards</li>
                  <li>Customer profiles and team roles</li>
                  <li>Reports and free data export</li>
                  <li className="plan-soon"><span className="soon-chip mono">Coming soon</span> Apple and Google Wallet cards</li>
                </ul>
                <a className="btn btn-ghost" href="mailto:hello@kembali.app?subject=Founding%20merchant">Join as founding instead</a>
              </article>

              <article className="plan reveal">
                <div className="plan-flag plan-flag-muted mono">At launch</div>
                <h2 className="plan-name">Growth</h2>
                <p className="plan-price"><span className="price price-muted">RM279</span><span className="plan-per mono">/outlet/month</span></p>
                <ul className="plan-list">
                  <li>Everything in Starter</li>
                  <li className="plan-soon"><span className="soon-chip mono">Coming soon</span> Apple and Google Wallet cards</li>
                  <li className="plan-soon"><span className="soon-chip mono">Coming soon</span> WhatsApp reminders and campaigns</li>
                  <li className="plan-soon"><span className="soon-chip mono">Coming soon</span> VIP member tags and referral rewards</li>
                  <li className="plan-soon"><span className="soon-chip mono">Coming soon</span> Your own domain, RM30 message credits monthly</li>
                </ul>
                <a className="btn btn-ghost" href="mailto:hello@kembali.app?subject=Founding%20merchant">Join as founding instead</a>
              </article>

            </div>

            <div className="plan-notes">
              <p className="reveal mono">Annual: pay for 10 months, get 12</p>
              <p className="reveal mono">5 or more outlets: 20% off, talk to us</p>
              <p className="reveal mono">Prices in RM, per outlet, per month</p>
            </div>
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section className="faq paper" data-theme="light">
          <div className="wrap">
            <p className="eyebrow reveal">Common questions</p>
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">Asked at every</span>
              <span className="reveal-line">counter so far.</span>
            </h2>
            <dl className="faq-list">
              <div className="faq-row reveal">
                <dt>Do customers download an app?</dt>
                <dd>No. The card opens in the phone's browser from a QR scan. Nothing to install, nothing to update.</dd>
              </div>
              <div className="faq-row reveal">
                <dt>Do I need new hardware?</dt>
                <dd>No. Staff stamp with the camera on any phone they already have.</dd>
              </div>
              <div className="faq-row reveal">
                <dt>What happens to my data if I leave?</dt>
                <dd>Export everything as CSV, free, any time. Your customer list is yours.</dd>
              </div>
              <div className="faq-row reveal">
                <dt>How do I pay?</dt>
                <dd>By invoice, monthly, after your free pilot. Bank transfer or DuitNow, no card required.</dd>
              </div>
            </dl>
            <div className="rl-cta reveal">
              <p>Not sure which counter you are? Send a message and describe your shop.</p>
              <a className="btn btn-solid" href="mailto:hello@kembali.app">Start your card</a>
            </div>
          </div>
        </section>
    </>
  );
}
