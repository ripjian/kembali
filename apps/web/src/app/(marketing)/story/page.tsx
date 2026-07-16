import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ten visits",
  description:
    "Follow one regular through ten visits at a Malaysian coffee shop. Her stamp card fills as you scroll.",
};

export default function StoryPage() {
  return (
    <>
        {/* ================= STORY HERO ================= */}
        <section className="hero story-hero" id="hero" data-theme="dark">
          <div className="hero-grid">
            <div className="hero-content">
              <p className="eyebrow hero-eyebrow"><span>A Kembali story</span><span className="dot-sep"></span><span>Nine chapters</span></p>
              <h1 className="hero-title" id="heroTitle">
                <span className="line"><span className="w">Ten</span></span>{" "}
                <span className="line"><span className="w accent-w">visits.</span></span>
              </h1>
              <p className="hero-sub">One regular, one coffee shop, and a card that cannot be lost.
              Aisyah's card fills as you scroll.</p>
              <div className="hero-actions">
                <Link className="btn btn-solid" href="#manifesto">Begin the week</Link>
                <Link className="btn btn-ghost" href="/">For your shop</Link>
              </div>
            </div>
            <figure className="hero-panel">
              <canvas className="hero-canvas" id="heroCanvas" data-tex="/showcase/story-serve.jpg" aria-hidden="true"></canvas>
              <img className="hero-fallback" src="/showcase/story-serve.jpg" alt="A regular being handed their cup at the coffee shop counter" loading="eager" />
              <figcaption className="hero-panel-cap mono">Corner Coffee, Petaling Jaya · her usual, over the counter</figcaption>
            </figure>
          </div>
          <div className="hero-foot">
            <p className="scroll-hint mono">Scroll<span className="hint-arrow">↓</span> each chapter is one visit</p>
            <p className="click-hint mono">Click anywhere: leave a stamp</p>
            <p className="hero-place mono">Tuesday, 7:42 am · her usual table</p>
          </div>
        </section>

        {/* ================= LEDGER TICKER ================= */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track" id="tickerTrack">
            <span>7:42 am · Aisyah joined · SS2</span>
            <span>7:48 am · white coffee · RM 4.00 · stamp 3 of 10</span>
            <span>7:51 am · pulled tea, toast · RM 8.50 · stamp 7 of 10</span>
            <span>7:55 am · reward confirmed · free coffee · SS2</span>
            <span>8:01 am · iced white coffee · RM 5.50 · stamp 1 of 10</span>
            <span>8:04 am · white coffee, eggs · RM 9.00 · stamp 9 of 10</span>
            <span>8:09 am · Ming Wei joined · Damansara</span>
            <span>8:12 am · white coffee · RM 4.00 · stamp 4 of 10</span>
          </div>
        </div>

        {/* ================= MANIFESTO ================= */}
        <section className="manifesto paper" id="manifesto" data-theme="light">
          <div className="wrap">
            <p className="eyebrow reveal">Chapter zero · the problem</p>
            <h2 className="manifesto-title">
              <span className="reveal-line">The tenth coffee</span>
              <span className="reveal-line">has always been free.</span>
              <span className="reveal-line muted-line">The paper card was</span>
              <span className="reveal-line muted-line">the problem.</span>
            </h2>
            <div className="manifesto-cols">
              <p className="reveal">Cards tear, fade, and go through the wash. The shop forgets. The customer gives up, and the habit quietly dies.</p>
              <p className="reveal">Kembali keeps the card where nobody loses it. It opens in the phone's browser, with nothing to install and nothing to print twice.</p>
            </div>
            <div className="manifesto-stage">
              <figure className="manifesto-photo reveal" data-parallax="-0.03">
                <img src="/showcase/scene-corner.jpg" alt="A quiet cafe corner with marble tables and iced drinks" loading="lazy" />
                <figcaption className="mono">the corner table, 7:15 am</figcaption>
              </figure>
            <figure className="paper-card reveal" data-parallax="0.045" aria-hidden="true">
              <div className="pcard">
                <p className="pcard-head">COFFEE CARD</p>
                <div className="pcard-grid">
                  <span className="pstamp filled"></span><span className="pstamp filled"></span><span className="pstamp filled"></span><span className="pstamp"></span><span className="pstamp"></span>
                  <span className="pstamp"></span><span className="pstamp"></span><span className="pstamp"></span><span className="pstamp"></span><span className="pstamp free">FREE</span>
                </div>
                <p className="pcard-foot">buy 9, get the 10th on us</p>
              </div>
              <figcaption className="mono">last seen: jacket pocket, March</figcaption>
            </figure>
            </div>
          </div>
        </section>

        {/* ================= VISIT 01 · JOIN ================= */}
        <section className="visit-join" id="visit-1" data-theme="dark">
          <div className="wrap">
            <p className="ledger-tag mono reveal">Visit 01 · Tue 7:42 am</p>
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">Join at the counter</span>
              <span className="reveal-line">in one scan.</span>
            </h2>
            <div className="join-grid">
              <figure className="join-poster reveal" data-parallax="0.05"><p className="col-label mono">At the till</p>
                <div className="poster">
                  <div className="poster-mark">
                    <svg viewBox="0 0 96 96" aria-hidden="true">
                      <circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="10"/>
                      <circle cx="48" cy="48" r="12" fill="var(--coral)"/>
                    </svg>
                  </div>
                  <p className="poster-title">Scan for your card</p>
                  <div className="poster-qr" id="posterQr"></div>
                  <p className="poster-foot mono">CORNER COFFEE · SS2 OUTLET</p>
                </div>
                <figcaption className="mono">printed from the QR kit, one per outlet</figcaption>
              </figure>
              <div className="join-copy">
                <p className="reveal">Aisyah scans the poster beside the till. Her number is checked with a six digit code.</p>
                <p className="reveal">The card opens in her browser, already in the shop's colours. No app store, no password, no form longer than one screen.</p>
                <ul className="join-facts">
                  <li className="reveal"><span className="mono">01</span>Phone number is the account</li>
                  <li className="reveal"><span className="mono">02</span>Works on any phone with a camera</li>
                  <li className="reveal"><span className="mono">03</span>First stamp lands the same minute</li>
                </ul>
              </div>
              <div className="join-phone reveal" id="joinPhone" data-parallax="-0.04"><p className="col-label mono">On her phone</p>
                <div className="phone">
                  <div className="phone-notch"></div>
                  <div className="phone-screen" id="phoneScreen">
                    {/* filled by JS: join -> code -> card */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= VISITS 02..09 · THE RITUAL ================= */}
        <section className="ritual" id="ritual" data-theme="dark">
          <div className="ritual-sticky">
            <div className="ritual-bg">
              <img src="/showcase/food-coffee.jpg" alt="" className="ritual-photo" data-idx="0" />
              <img src="/showcase/food-breakfast.jpg" alt="" className="ritual-photo" data-idx="1" />
              <img src="/showcase/food-tea.jpg" alt="" className="ritual-photo" data-idx="2" />
              <img src="/showcase/food-croissant.jpg" alt="" className="ritual-photo" data-idx="3" />
              <div className="ritual-shade"></div>
            </div>
            <div className="ritual-content wrap">
              <div className="ritual-left">
                <p className="ledger-tag mono">Visits 02 to 09 · the ritual</p>
                <h2 className="section-title">Three seconds<br />at the till.</h2>
                <p className="ritual-sub">Farid scans her code, types the amount, done. The stamp, the ringgit value, and the outlet are written to a ledger that nothing can quietly edit.</p>
                <ol className="ledger" id="ledger">
                  <li className="ledger-row" data-stamp="2"><span className="mono lr-date">Wed 8:01</span><span className="lr-item">white coffee, toast</span><span className="mono lr-amt">RM 8.50</span></li>
                  <li className="ledger-row" data-stamp="3"><span className="mono lr-date">Thu 7:56</span><span className="lr-item">white coffee</span><span className="mono lr-amt">RM 4.00</span></li>
                  <li className="ledger-row" data-stamp="4"><span className="mono lr-date">Fri 8:03</span><span className="lr-item">pulled tea, eggs</span><span className="mono lr-amt">RM 9.00</span></li>
                  <li className="ledger-row" data-stamp="5"><span className="mono lr-date">Mon 7:49</span><span className="lr-item">white coffee</span><span className="mono lr-amt">RM 4.00</span></li>
                  <li className="ledger-row" data-stamp="6"><span className="mono lr-date">Tue 8:12</span><span className="lr-item">iced white coffee</span><span className="mono lr-amt">RM 5.50</span></li>
                  <li className="ledger-row" data-stamp="7"><span className="mono lr-date">Wed 7:58</span><span className="lr-item">white coffee, toast</span><span className="mono lr-amt">RM 8.50</span></li>
                  <li className="ledger-row" data-stamp="8"><span className="mono lr-date">Thu 8:04</span><span className="lr-item">white coffee</span><span className="mono lr-amt">RM 4.00</span></li>
                  <li className="ledger-row" data-stamp="9"><span className="mono lr-date">Fri 7:51</span><span className="lr-item">pulled tea, toast set</span><span className="mono lr-amt">RM 10.00</span></li>
                </ol>
                <p className="ledger-total mono" id="ledgerTotal">RM 0.00 recorded · 1 visit</p>
              </div>
              <div className="ritual-right">
                <div className="big-card" id="bigCard">
                  <div className="bc-head">
                    <span className="bc-name">Aisyah</span>
                    <span className="bc-shop mono">CORNER COFFEE</span>
                  </div>
                  <div className="bc-grid" id="bcGrid">
                    {/* 10 stamp cells by JS */}
                  </div>
                  <div className="bc-foot">
                    <span className="mono" id="bcCount">1 of 10</span>
                    <span className="bc-hint">10th coffee free</span>
                  </div>
                </div>
                <p className="bc-caption mono">stamp_events · append only · amount per stamp</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= VISIT 10 · REWARD ================= */}
        <section className="reward" id="reward" data-theme="coral">
          <canvas className="reward-ink" id="rewardInk" aria-hidden="true"></canvas>
          <div className="wrap reward-content">
            <p className="ledger-tag mono reveal">Visit 10 · Sat 9:15 am</p>
            <h2 className="reward-title" id="rewardTitle"><span className="reveal-line">Visit ten.</span><span className="reveal-line">The free one.</span></h2>
            <div className="reward-grid">
              <div className="coupon reveal" id="coupon" data-parallax="0.035">
                <p className="coupon-label mono">REWARD COUPON</p>
                <p className="coupon-code mono">KMB-7F2K-QX3D</p>
                <div className="coupon-meta">
                  <span>Single use</span>
                  <span className="dot-sep"></span>
                  <span>Expires in 15:00</span>
                </div>
                <div className="coupon-tear" aria-hidden="true"></div>
                <div className="redeemed-stamp mono" id="redeemedStamp" aria-hidden="true">Redeemed<br />Sat 9:17 am</div>
              </div>
              <div className="reward-copy">
                <p className="reveal">Aisyah taps redeem and shows the code. Farid scans it, hits confirm, and the tenth coffee is free.</p>
                <p className="reveal">Points come off only when staff confirm. A screenshot from yesterday buys nothing.</p>
                <p className="reveal reward-fact mono">tested: two cashiers, one coupon, one payout</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= VISIT 11 · THE RETURN ================= */}
        <section className="return paper" id="visit-11" data-theme="light">
          <div className="wrap">
            <p className="ledger-tag mono reveal">Visit 11 · Mon 7:44 am</p>
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">The card</span>
              <span className="reveal-line">starts again.</span>
            </h2>
            <div className="return-grid">
              <div className="return-copy">
                <p className="reveal">A fresh card opens the next Monday, first stamp landed before her coffee cools.</p>
                <p className="reveal">This time Ming Wei comes along. He scans the same poster, and the shop gains one more regular.</p>
                <p className="reveal return-note mono">referral rewards · planned, see the <Link href="/roadmap">roadmap</Link></p>
              </div>
              <figure className="return-figure reveal" data-parallax="0.04" aria-hidden="true">
                <div className="pcard pcard-fresh">
                  <p className="pcard-head">COFFEE CARD · NO 2</p>
                  <div className="pcard-grid">
                    <span className="pstamp filled"></span><span className="pstamp"></span><span className="pstamp"></span><span className="pstamp"></span><span className="pstamp"></span>
                    <span className="pstamp"></span><span className="pstamp"></span><span className="pstamp"></span><span className="pstamp"></span><span className="pstamp free">FREE</span>
                  </div>
                  <p className="pcard-foot">stamp 1 of 10 · Mon 7:44 am</p>
                </div>
              </figure>
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="story-cta" data-theme="dark">
          <div className="wrap">
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">This could be</span>
              <span className="reveal-line">your counter.</span>
            </h2>
            <p className="cta-copy reveal">Cafes, gyms, salons, car washes. Anywhere the same faces return, the card fits.</p>
            <div className="hero-actions reveal">
              <Link className="btn btn-solid" href="/pricing">Start your card</Link>
              <Link className="btn btn-ghost" href="/">See how it works</Link>
            </div>
          </div>
        </section>
      <aside className="hud" id="hud" aria-label="Story progress, styled as a stamp card">
        <p className="hud-label mono">AISYAH’S CARD</p>
        <div className="hud-grid" id="hudGrid"></div>
        <p className="hud-count mono" id="hudCount">0 of 10</p>
      </aside>
    </>
  );
}
