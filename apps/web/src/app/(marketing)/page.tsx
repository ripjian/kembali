import type { Metadata } from "next";
import Link from "next/link";

import { DemoCard } from "@/components/marketing/demo-card";
import { ReachOut } from "@/components/marketing/reach-out";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  description:
    "Kembali puts a stamp card in every customer's phone. Staff scan a code, the stamp lands in seconds, and you see it the moment it happens.",
};

export default function HomePage() {
  return (
    <>
        {/* ================= HERO ================= */}
        <section className="hero hero-has-shell" id="hero" data-theme="dark">
          <div className="hero-shell">
          <div className="hero-grid">
            <div className="hero-content">
              <p className="eyebrow hero-eyebrow"><span>Digital stamp cards</span><span className="dot-sep"></span><span>Built for Malaysian shops</span></p>
              <h1 className="hero-title" id="heroTitle">
                <span className="line"><span className="w">Your</span> <span className="w accent-w">regulars</span></span>{" "}
                <span className="line"><span className="w">are</span> <span className="w">the</span> <span className="w">whole</span></span>{" "}
                <span className="line"><span className="w">business.</span></span>
              </h1>
              <p className="hero-sub">Kembali puts a stamp card in every customer's phone.
              Staff scan a code and the stamp lands in seconds, at any kind of counter.</p>
              <div className="hero-actions">
                <Link className="btn btn-solid" href="/pricing">Start your card</Link>
                <Link className="btn btn-ghost" href="/story">Watch a card fill</Link>
              </div>
            </div>
            <figure className="hero-panel">
              <canvas className="hero-canvas" id="heroCanvas" data-tex="/showcase/hero-serve.jpg" aria-hidden="true"></canvas>
              <img className="hero-fallback" src="/showcase/hero-serve.jpg" alt="A barista places a cappuccino on the counter for a customer" loading="eager" />
              <figcaption className="hero-panel-cap mono">7:42 am · first order over the counter</figcaption>
            </figure>
          </div>
          </div>
          <div className="hero-foot">
            <p className="scroll-hint mono">Scroll<span className="hint-arrow">↓</span> see how it works</p>
            <p className="click-hint mono">Click anywhere: leave a stamp</p>
            <p className="hero-place mono">No app to build · no hardware to buy</p>
          </div>
        </section>

        {/* ================= LEDGER TICKER ================= */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track" id="tickerTrack">
            <span>7:48 am · white coffee · RM 4.00 · stamp 3 of 10</span>
            <span>9:15 am · wash and vacuum · RM 28.00 · stamp 6 of 9</span>
            <span>10:20 am · gym check-in · visit 11 · guest pass earned</span>
            <span>12:05 pm · chicken rice set · RM 12.50 · 12 points</span>
            <span>3:30 pm · iced dessert bowl · RM 7.00 · stamp 2 of 10</span>
            <span>5:45 pm · haircut · RM 38.00 · stamp 4 of 6</span>
            <span>7:12 pm · reward confirmed · free coffee</span>
            <span>8:40 pm · foot massage · RM 68.00 · 68 points</span>
          </div>
        </div>

        {/* ================= INDUSTRIES ================= */}
        <section className="industries" id="industries" data-theme="dark">
          <div className="wrap">
            <p className="eyebrow reveal">One card, many counters</p>
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">Anywhere people</span>
              <span className="reveal-line">come back.</span>
            </h2>
            <p className="ind-sub reveal">You set what a visit earns and what the reward is. Kembali does the counting, the coupons, and the reports.</p>
            <div className="ind-grid">
              <div className="ind-card reveal">
                <div className="ic-photo"><img src="/showcase/ind-cafe.jpg" alt="A warm cafe interior with wooden tables by a big window" loading="lazy" /></div>
                <div className="ic-meta"><b>Coffee shops</b><span className="mono">Buy 9, the 10th free</span></div>
              </div>
              <div className="ind-card reveal">
                <div className="ic-photo"><img src="/showcase/ind-restaurant.jpg" alt="A fine dining plate on a white tablecloth" loading="lazy" /></div>
                <div className="ic-meta"><b>Restaurants</b><span className="mono">RM 1 spent = 1 point</span></div>
              </div>
              <div className="ind-card reveal">
                <div className="ic-photo"><img src="/showcase/ind-dessert.jpg" alt="A cream dessert bowl with a raspberry" loading="lazy" /></div>
                <div className="ic-meta"><b>Dessert shops</b><span className="mono">10 visits, one free bowl</span></div>
              </div>
              <div className="ind-card reveal">
                <div className="ic-photo"><img src="/showcase/ind-gym.jpg" alt="A bright gym interior with racks and benches" loading="lazy" /></div>
                <div className="ic-meta"><b>Gyms</b><span className="mono">12 check-ins, one guest pass</span></div>
              </div>
              <div className="ind-card reveal">
                <div className="ic-photo"><img src="/showcase/ind-salon.jpg" alt="A barber combing and trimming a client's hair" loading="lazy" /></div>
                <div className="ic-meta"><b>Salons</b><span className="mono">5 cuts, half off the 6th</span></div>
              </div>
              <div className="ind-card reveal">
                <div className="ic-photo"><img src="/showcase/ind-carwash.jpg" alt="A hand drying a wet red car with a cloth" loading="lazy" /></div>
                <div className="ic-meta"><b>Car washes</b><span className="mono">Wash 9, the 10th free</span></div>
              </div>
              <div className="ind-card reveal">
                <div className="ic-photo"><img src="/showcase/ind-wellness.jpg" alt="A back massage at a spa" loading="lazy" /></div>
                <div className="ic-meta"><b>Wellness</b><span className="mono">10 sessions, 1 upgrade</span></div>
              </div>
              <Link className="ind-card ind-yours reveal" href="/pricing">
                <div className="iy-inner">
                  <svg viewBox="0 0 96 96" aria-hidden="true">
                    <circle cx="48" cy="48" r="34" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="8 10" strokeLinecap="round"/>
                    <circle cx="48" cy="48" r="12" fill="var(--coral)"/>
                  </svg>
                  <div className="ic-meta"><b>Your shop</b><span className="mono">Name the reward, we count</span></div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= JOIN ================= */}
        <section className="visit-join" id="visit-1" data-theme="dark">
          <div className="wrap">
            <p className="ledger-tag mono reveal">For your customers</p>
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
                <p className="reveal">Your customer scans the poster beside the till. Their number is checked with a six digit code.</p>
                <p className="reveal">The card opens in their browser, already in your colours. No app store, no password, no form longer than one screen.</p>
                <ul className="join-facts">
                  <li className="reveal"><span className="mono">01</span>Phone number is the account</li>
                  <li className="reveal"><span className="mono">02</span>Works on any phone with a camera</li>
                  <li className="reveal"><span className="mono">03</span>First stamp lands the same minute</li>
                </ul>
                <div className="join-try reveal">
                  <p className="col-label mono">Try it yourself</p>
                  <DemoCard />
                </div>
              </div>
              <div className="join-phone reveal" id="joinPhone" data-parallax="-0.04"><p className="col-label mono">On their phone</p>
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

        {/* ================= STORY TEASER ================= */}
        <section className="teaser paper" id="teaser" data-theme="light">
          <div className="wrap teaser-grid">
            <figure className="teaser-photo reveal" data-parallax="-0.03">
              <img src="/showcase/scene-corner.jpg" alt="A quiet cafe corner with marble tables and iced drinks" loading="lazy" />
              <figcaption className="mono">Corner Coffee, before the rush</figcaption>
            </figure>
            <div className="teaser-copy">
              <p className="eyebrow reveal">One regular, ten visits</p>
              <h2 className="section-title reveal-line-group">
                <span className="reveal-line">See the card</span>
                <span className="reveal-line">from her side.</span>
              </h2>
              <p className="reveal">We followed Aisyah through her card at Corner Coffee, stamp by stamp, to the free one.</p>
              <p className="reveal">It is the quickest way to feel what your customers get.</p>
              <Link className="btn btn-solid reveal" href="/story">Follow the story</Link>
            </div>
          </div>
        </section>

        {/* ================= MERCHANT ================= */}
        <section className="merchant paper" id="merchant" data-theme="light">
          <div className="wrap">
            <p className="eyebrow reveal">Meanwhile, behind the counter</p>
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">You see every stamp</span>
              <span className="reveal-line">the moment it lands.</span>
            </h2>
            <div className="dash reveal" id="dash">
              <div className="dash-chrome">
                <span className="dc-dot"></span><span className="dc-dot"></span><span className="dc-dot"></span>
                <span className="dc-url mono">kembali.app/admin/corner-coffee</span>
              </div>
              <div className="dash-body">
                <aside className="dash-nav">
                  <span className="dn-item active">Overview</span>
                  <span className="dn-item">Customers</span>
                  <span className="dn-item">Rewards</span>
                  <span className="dn-item">Reports</span>
                  <span className="dn-item">Team</span>
                </aside>
                <div className="dash-main">
                  <p className="dash-greet">Selamat kembali ke Corner Coffee</p>
                  <div className="dash-tiles">
                    <div className="tile"><span className="tile-num" data-count="41">0</span><span className="tile-label">stamps today</span></div>
                    <div className="tile"><span className="tile-num" data-count="6">0</span><span className="tile-label">rewards redeemed</span></div>
                    <div className="tile"><span className="tile-num" data-count="512" data-prefix="RM ">0</span><span className="tile-label">recorded today</span></div>
                    <div className="tile"><span className="tile-num" data-count="68" data-suffix="%">0</span><span className="tile-label">visits from regulars</span></div>
                  </div>
                  <div className="dash-week">
                    <p className="mono dw-label">STAMPS THIS WEEK</p>
                    <div className="dw-bars" id="dwBars">
                      <div className="dw-bar" style={{ "--v": .45 } as CSSProperties}><i></i><b>M</b></div>
                      <div className="dw-bar" style={{ "--v": .62 } as CSSProperties}><i></i><b>T</b></div>
                      <div className="dw-bar" style={{ "--v": .55 } as CSSProperties}><i></i><b>W</b></div>
                      <div className="dw-bar" style={{ "--v": .78 } as CSSProperties}><i></i><b>T</b></div>
                      <div className="dw-bar" style={{ "--v": .92 } as CSSProperties}><i></i><b>F</b></div>
                      <div className="dw-bar" style={{ "--v": .7 } as CSSProperties}><i></i><b>S</b></div>
                      <div className="dw-bar" style={{ "--v": .3 } as CSSProperties}><i></i><b>S</b></div>
                    </div>
                  </div>
                  <div className="dash-feed">
                    <p className="mono dw-label">JUST NOW</p>
                    <div className="df-row"><span className="df-dot"></span>Aisyah · stamp 10 of 10 · RM 0.00 · SS2 outlet</div>
                    <div className="df-row"><span className="df-dot"></span>Ming Wei · stamp 4 of 10 · RM 12.00 · SS2 outlet</div>
                    <div className="df-row"><span className="df-dot"></span>Priya · reward confirmed · latte · Damansara outlet</div>
                  </div>
                </div>
              </div>
            </div>
            <ul className="merchant-facts">
              <li className="reveal"><strong>Roles that hold.</strong> Cashiers stamp. Owners see money. Permissions are checked on the server, not in the menu.</li>
              <li className="reveal"><strong>Every outlet counted.</strong> Each stamp records which till it came from, so reports split cleanly by branch.</li>
              <li className="reveal"><strong>Reports you can hand over.</strong> Customers, transactions, and rewards export to CSV with a date range.</li>
            </ul>
            <div className="proof" id="proof">
              <p className="proof-label mono reveal">Screens below are the real product, photographed today</p>
              <div className="proof-row">
                <figure className="proof-shot proof-wide reveal"><img src="/showcase/real-admin.png" alt="The real Kembali merchant overview" loading="lazy" /><figcaption className="mono">merchant overview, signed in as the owner</figcaption></figure>
                <figure className="proof-shot reveal"><img src="/showcase/real-card.png" alt="The real customer card in a phone browser" loading="lazy" /><figcaption className="mono">customer card, in the shop's colours</figcaption></figure>
              </div>
            </div>
          </div>
        </section>

        {/* ================= REACH OUT ================= */}
        <section className="reachout paper" id="reach-out" data-theme="light">
          <div className="wrap">
            <p className="eyebrow reveal">See how it fits your shop</p>
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">Three questions,</span>{" "}
              <span className="reveal-line">then a straight answer.</span>
            </h2>
            <ReachOut />
          </div>
        </section>

        {/* ================= SETUP + CTA ================= */}
        <section className="setup" id="start" data-theme="dark">
          <img className="setup-bg" src="/showcase/scene-shophouse.jpg" alt="" loading="lazy" aria-hidden="true" />
          <div className="setup-veil" aria-hidden="true"></div>
          <div className="wrap setup-content">
            <p className="eyebrow reveal">Your shop, next week</p>
            <h2 className="section-title reveal-line-group">
              <span className="reveal-line">Live before the</span>
              <span className="reveal-line">morning rush.</span>
            </h2>
            <ol className="steps">
              <li className="reveal"><span className="step-num mono">1</span><h3>Tell us your shop</h3><p>Name, outlets, and what the tenth visit earns.</p></li>
              <li className="reveal"><span className="step-num mono">2</span><h3>Print the QR kit</h3><p>Posters arrive as PDFs in your colours, sized for the till.</p></li>
              <li className="reveal"><span className="step-num mono">3</span><h3>Brief the staff</h3><p>Scan member, type amount. Most shops learn it in ten minutes.</p></li>
            </ol>
            <div className="pricing reveal">
              <p className="price-line"><span className="price">RM99</span> per outlet, per month at the founding price.</p>
              <p className="price-sub">No card reader, no contract, no charge until your card is live.</p>
            </div>
            <div className="hero-actions">
              <a className="btn btn-solid btn-big reveal" href="mailto:hello@kembali.app">Start your card</a>
              <Link className="btn btn-ghost btn-big reveal" href="/pricing">See pricing</Link>
            </div>
            <p className="cta-sub mono reveal">hello@kembali.app · reply within one working day</p>
          </div>
        </section>
    </>
  );
}
