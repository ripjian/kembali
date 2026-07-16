import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Kembali is built in Petaling Jaya for the shops we stand in line at. The name means return.",
};

export default function AboutPage() {
  return (
    <>
        <section className="page-hero" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">About</p>
            <h1 className="hero-title page-title" id="heroTitle">
              <span className="line"><span className="w">The</span> <span className="w">name</span></span>{" "}
              <span className="line"><span className="w">means</span> <span className="w accent-w">return.</span></span>
            </h1>
            <p className="hero-sub">The whole product is that one moment: the same face
            at the counter, twice a week, by choice.</p>
          </div>
        </section>

        <section className="about paper" data-theme="light">
          <div className="wrap">
            <div className="about-grid">
              <div className="about-copy">
                <p className="reveal">Kembali is built in Petaling Jaya, for the shops we actually stand in line at. The corner coffee shop, the wash around the block, the salon that knows your usual.</p>
                <p className="reveal">Chains get loyalty software with account managers. Small shops get a rubber stamp and a card that dies in the wash. We think the corner shop deserves the better half of that deal, at a corner shop price.</p>
                <p className="reveal">So Kembali stays small on purpose: a card in the customer's phone, a scan at the till, and honest numbers for the owner. Everything else is in service of those three.</p>
              </div>
              <figure className="about-photo reveal" data-parallax="-0.03">
                <img src="/showcase/scene-corner.jpg" alt="A quiet cafe corner with marble tables and iced drinks" loading="lazy" />
                <figcaption className="mono">the corner table, where this started</figcaption>
              </figure>
            </div>

            <div className="rl-group about-principles">
              <p className="rl-head mono reveal">What we hold ourselves to</p>
              <ol className="rl-rows">
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Three seconds at the till</b><p>If a feature slows the queue, it does not ship. Speed at the counter beats everything.</p></div>
                </li>
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Honest records</b><p>Stamps and points are append-only. What the owner sees is what happened, always.</p></div>
                </li>
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Your regulars stay yours</b><p>Free CSV export on every plan. Leaving Kembali never costs a shop its customer list.</p></div>
                </li>
                <li className="rl-row" data-state="live">
                  <span className="rl-stamp" aria-hidden="true"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="11"/><circle cx="48" cy="48" r="13" fill="currentColor"/></svg></span>
                  <div className="rl-body"><b>Priced for shops, not chains</b><p>One flat price per outlet, invoiced monthly, no contract. See <Link href="/pricing">pricing</Link>.</p></div>
                </li>
              </ol>
            </div>

            <div className="rl-cta reveal">
              <p>The quickest way to understand Kembali is to watch one card fill.</p>
              <Link className="btn btn-solid" href="/story">Follow the story</Link>
            </div>
          </div>
        </section>
    </>
  );
}
