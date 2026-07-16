import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "The seven stops on Kembali's roadmap: what is live, what just landed, and what comes next.",
};

export default function RoadmapPage() {
  return (
    <>
        {/* ================= PAGE HERO ================= */}
        <section className="page-hero" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">The roadmap</p>
            <h1 className="hero-title page-title" id="heroTitle">
              <span className="line"><span className="w">Built</span> <span className="w">in</span></span>{" "}
              <span className="line"><span className="w">the</span> <span className="w accent-w">open.</span></span>
            </h1>
            <p className="hero-sub">Every stop is a station on the same journey. A stamped
            station is live in the product today. A dashed one is where we are headed, in order.</p>
          </div>
        </section>

        {/* ================= STOPS ================= */}
        <section className="roadlist paper" data-theme="light">
          <div className="wrap">
            <ol className="rl-timeline" id="rlTimeline">

              <li className="rl-stop" data-state="live" data-anim="foundations">
                <span className="rl-station" aria-hidden="true"></span>
                <article className="rl-card">
                  <div className="rl-card-head">
                    <span className="rl-chip rl-chip-live">Live</span>
                    <span className="rl-num mono">stop 00</span>
                  </div>
                  <h2 className="rl-title">Foundations</h2>
                  <p className="rl-lead">The groundwork is done: a platform where each shop's data is isolated at the database layer, and a stamp history that cannot be edited.</p>
                  <ul className="rl-points">
                    <li>Isolated data per shop</li>
                    <li>Tamper-proof stamp history</li>
                    <li>Brand and theming engine, with your colours checked for readable contrast</li>
                  </ul>
                            <div className="rl-illus" data-illus="foundations" aria-hidden="true"><div className="illus-scene sc-fnd">
      <span className="fnd-slab il" style={{ "--i": 0 } as CSSProperties}><i>Shop A</i></span>
      <span className="fnd-slab il" style={{ "--i": 1 } as CSSProperties}><i>Shop B</i></span>
      <span className="fnd-slab il" style={{ "--i": 2 } as CSSProperties}><i>Shop C</i></span>
      <span className="fnd-lock il" style={{ "--i": 3 } as CSSProperties}><svg viewBox="0 0 24 24"><rect x="5.5" y="10.5" width="13" height="9" rx="1.6" fill="currentColor"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2"/></svg></span>
      <span className="illus-label mono">isolated · locked</span>
      </div></div>
                </article>
              </li>

              <li className="rl-stop" data-state="live" data-anim="stamps">
                <span className="rl-station" aria-hidden="true"></span>
                <article className="rl-card">
                  <div className="rl-card-head">
                    <span className="rl-chip rl-chip-live">Live</span>
                    <span className="rl-num mono">stop 01</span>
                  </div>
                  <h2 className="rl-title">The stamp card, done right</h2>
                  <p className="rl-lead">Customers get a card from a QR in under 30 seconds, staff stamp it with any phone, and simple reports show it working.</p>
                  <ul className="rl-points">
                    <li>Customer card with a live stamp animation</li>
                    <li>Three-second stamping with fraud-proof QR codes</li>
                    <li>Print-ready QR kit for the counter</li>
                    <li>Every stamp tagged to the serving outlet</li>
                    <li>Program set up with you during your pilot</li>
                    <li>Simple reports: stamps, sales and repeat visits</li>
                  </ul>
                            <div className="rl-illus" data-illus="stamps" aria-hidden="true"><div className="illus-scene sc-stamps">
      <div className="stamp-grid"><span className="st-dot il rla-stamp" style={{ "--i": 0 } as CSSProperties}></span><span className="st-dot il rla-stamp" style={{ "--i": 1 } as CSSProperties}></span><span className="st-dot il rla-stamp" style={{ "--i": 2 } as CSSProperties}></span><span className="st-dot il rla-stamp" style={{ "--i": 3 } as CSSProperties}></span><span className="st-dot il rla-stamp" style={{ "--i": 4 } as CSSProperties}></span><span className="st-dot il rla-stamp" style={{ "--i": 5 } as CSSProperties}></span><span className="st-dot il rla-stamp" style={{ "--i": 6 } as CSSProperties}></span><span className="st-dot il rla-stamp" style={{ "--i": 7 } as CSSProperties}></span><span className="st-dot il rla-stamp" style={{ "--i": 8 } as CSSProperties}></span><span className="st-dot il rla-stamp st-free" style={{ "--i": 9 } as CSSProperties}>★</span></div>
      <span className="illus-label mono">10 stamps → free coffee</span>
      </div></div>
                </article>
              </li>

              <li className="rl-stop" data-state="new" data-anim="points">
                <span className="rl-station" aria-hidden="true"></span>
                <article className="rl-card">
                  <div className="rl-card-head">
                    <span className="rl-chip rl-chip-live">New</span>
                    <span className="rl-num mono">stop 02</span>
                  </div>
                  <h2 className="rl-title">Points and rewards</h2>
                  <p className="rl-lead">Every visit earns points, and customers spend them on rewards you choose, redeemed with a single-use code at your counter.</p>
                  <ul className="rl-points">
                    <li>Points from each visit, at a rate you set</li>
                    <li>A rewards catalog you control</li>
                    <li>One-tap redeem with a single-use coupon</li>
                    <li>Point adjustments your customers can see</li>
                    <li>Points earned and spent, in your reports</li>
                  </ul>
                            <div className="rl-illus" data-illus="points" aria-hidden="true"><div className="illus-scene sc-points">
      <div className="pt-conv">
      <span className="pt-rm mono il" style={{ "--i": 0 } as CSSProperties}>RM 12</span>
      <span className="pt-arw il" style={{ "--i": 1 } as CSSProperties}>→</span>
      <span className="pt-pts mono il rla-tick" style={{ "--i": 2 } as CSSProperties}>+12 pts</span>
      </div>
      <div className="pt-bar il" style={{ "--i": 3 } as CSSProperties}><span className="rla-fill"></span></div>
      <div className="pt-coupon il" style={{ "--i": 4 } as CSSProperties}><span className="rla-reveal mono">KMB-7F2K</span></div>
      <span className="illus-label mono">spend → points → reward</span>
      </div></div>
                </article>
              </li>

              <li className="rl-stop" data-state="next" data-anim="wallet">
                <span className="rl-station" aria-hidden="true"></span>
                <article className="rl-card">
                  <div className="rl-card-head">
                    <span className="rl-chip">Up next</span>
                    <span className="rl-num mono">stop 03</span>
                  </div>
                  <h2 className="rl-title">Wallet cards and VIP tags</h2>
                  <p className="rl-lead">Cards that live in the phone's own wallet and update the moment a stamp lands. VIP and staff tags earn points faster.</p>
                  <ul className="rl-points">
                    <li>Apple Wallet pass with live updates</li>
                    <li>Google Wallet loyalty cards</li>
                    <li>VIP and staff tags with bonus points</li>
                  </ul>
                            <div className="rl-illus" data-illus="wallet" aria-hidden="true"><div className="illus-scene sc-wallet">
      <div className="wl-phone"><span className="wl-pass il rla-pass"><b>Coffee Card</b><span className="wl-dots"><i></i><i></i><i></i><i className="off"></i><i className="off"></i></span></span></div>
      <span className="wl-vip il rla-double" style={{ "--i": 2 } as CSSProperties}><span className="mono">VIP</span> ×2</span>
      <span className="illus-label mono">wallet · VIP ×2</span>
      </div></div>
                </article>
              </li>

              <li className="rl-stop" data-state="plan" data-anim="messages">
                <span className="rl-station" aria-hidden="true"></span>
                <article className="rl-card">
                  <div className="rl-card-head">
                    <span className="rl-chip">Planned</span>
                    <span className="rl-num mono">stop 04</span>
                  </div>
                  <h2 className="rl-title">Bring them back on WhatsApp</h2>
                  <p className="rl-lead">Warm messages that invite customers back, on the channel they actually read. Every message is opt-in, as PDPA requires.</p>
                  <ul className="rl-points">
                    <li>Welcome, birthday and milestone rewards</li>
                    <li>Reward-expiry reminders and win-back offers</li>
                    <li>Templates in English, Bahasa Melayu and Chinese</li>
                  </ul>
                            <div className="rl-illus" data-illus="messages" aria-hidden="true"><div className="illus-scene sc-msgs">
      <span className="msg-b il rla-bubble b-in" style={{ "--i": 0 } as CSSProperties}>Your card is ready ☕</span>
      <span className="msg-b il rla-bubble b-in" style={{ "--i": 1 } as CSSProperties}>2 stamps to your free coffee</span>
      <span className="msg-b il rla-bubble b-out" style={{ "--i": 2 } as CSSProperties}>Happy birthday, a treat is on us 🎂</span>
      <span className="illus-label mono">welcome · birthday · win-back</span>
      </div></div>
                </article>
              </li>

              <li className="rl-stop" data-state="plan" data-anim="referral">
                <span className="rl-station" aria-hidden="true"></span>
                <article className="rl-card">
                  <div className="rl-card-head">
                    <span className="rl-chip">Planned</span>
                    <span className="rl-num mono">stop 05</span>
                  </div>
                  <h2 className="rl-title">Referral rewards</h2>
                  <p className="rl-lead">Your regulars bring their friends. Everyone shares a personal link. When a friend joins and visits, both sides get a treat.</p>
                  <ul className="rl-points">
                    <li>Personal referral links and QR codes</li>
                    <li>Rewards for the sender and the friend</li>
                    <li>Referral numbers in your reports</li>
                  </ul>
                            <div className="rl-illus" data-illus="referral" aria-hidden="true"><div className="illus-scene sc-ref">
      <span className="ref-node il" style={{ "--i": 0 } as CSSProperties}>A<span className="ref-treat rla-pop" style={{ "--i": 1 } as CSSProperties}></span></span>
      <span className="ref-line"><span className="rla-travel"></span></span>
      <span className="ref-node il" style={{ "--i": 2 } as CSSProperties}>B<span className="ref-treat rla-pop" style={{ "--i": 3 } as CSSProperties}></span></span>
      <span className="illus-label mono">share · both rewarded</span>
      </div></div>
                </article>
              </li>

              <li className="rl-stop" data-state="plan" data-anim="platform">
                <span className="rl-station" aria-hidden="true"></span>
                <article className="rl-card">
                  <div className="rl-card-head">
                    <span className="rl-chip">Planned</span>
                    <span className="rl-num mono">stop 06</span>
                  </div>
                  <h2 className="rl-title">Connect your POS and deeper reports</h2>
                  <p className="rl-lead">Kembali opens up: an API and webhooks for POS integrations, plus the deeper numbers for growing chains, across every branch.</p>
                  <ul className="rl-points">
                    <li>Public API and webhooks, POS integrations</li>
                    <li>Repeat-visit rate, member share, redemptions</li>
                    <li>Cross-outlet stamping and per-branch reports</li>
                  </ul>
                            <div className="rl-illus" data-illus="platform" aria-hidden="true"><div className="illus-scene sc-plat">
      <span className="plat-node il rla-node" style={{ "--i": 0 } as CSSProperties}>POS</span>
      <span className="plat-wire"></span>
      <span className="plat-hub il rla-node" style={{ "--i": 1 } as CSSProperties}><svg className="kmark" viewBox="0 0 96 96" aria-hidden="true"><circle cx="48" cy="48" r="30" fill="none" stroke="currentColor" strokeWidth="10"/><circle cx="48" cy="48" r="11" fill="var(--coral)"/></svg><b>API</b></span>
      <span className="plat-wire"></span>
      <span className="plat-node il rla-node" style={{ "--i": 2 } as CSSProperties}>Webhooks</span>
      <span className="illus-label mono">POS · API · webhooks</span>
      </div></div>
                </article>
              </li>

            </ol>

            <div className="rl-cta reveal">
              <p>Founding merchants get every stop as it ships, at the same RM99.</p>
              <Link className="btn btn-solid" href="/pricing">See the founding price</Link>
            </div>
          </div>
        </section>
      <div className="rl-preview" id="rlPreview" aria-hidden="true"><div className="rl-preview-card"></div></div>
    </>
  );
}
