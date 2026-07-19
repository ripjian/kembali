"use client";

import { useEffect, useState } from "react";

/* An interactive mock of a branded loyalty app, rendered as a phone.
 *
 * Design only: no app code exists. The screens mirror the real customer
 * PWA (card first, show QR, rewards with a timed coupon, profile) so the
 * demo never promises flows the product does not have. Coral stays the
 * earned colour; the brand colour dresses the chrome (BRAND.md). */

const TOTAL = 10;
const STAMPS = 8;
const POINTS = 87;
const COUPON_SECONDS = 15 * 60;

type Tab = "card" | "rewards" | "you";

const REWARDS = [
  { id: "pastry", name: "Pastry of the day", pts: 80 },
  { id: "coffee", name: "Free coffee of your choice", pts: 120 },
  { id: "tote", name: "Corner Coffee tote", pts: 250 },
];

function CouponSheet({ onClose }: { onClose: () => void }) {
  const [left, setLeft] = useState(COUPON_SECONDS);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="bapp-sheetwrap" onClick={onClose}>
      <div className="bapp-sheet" onClick={(e) => e.stopPropagation()}>
        <p className="bapp-sheet-label mono">Reward coupon</p>
        <p className="bapp-code mono">KMB-7F2K-QX3D</p>
        <p className="bapp-timer mono">
          Single use &middot; expires in {mm}:{ss}
        </p>
        <p className="bapp-sheet-note">Show this at the counter. Points come off when staff confirm.</p>
        <button type="button" className="bapp-btn bapp-btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function QrSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="bapp-sheetwrap" onClick={onClose}>
      <div className="bapp-sheet" onClick={(e) => e.stopPropagation()}>
        <p className="bapp-sheet-label mono">Your member code</p>
        <img className="bapp-qr" src="/showcase/qr-join.svg" alt="" aria-hidden />
        <p className="bapp-sheet-note">Staff scan this to add your stamp.</p>
        <button type="button" className="bapp-btn bapp-btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export function BrandAppDemo() {
  const [tab, setTab] = useState<Tab>("card");
  const [qrOpen, setQrOpen] = useState(false);
  const [couponFor, setCouponFor] = useState<string | null>(null);
  const [optIn, setOptIn] = useState(false);

  return (
    <div className="bapp-phone" role="group" aria-label="A demo of a branded loyalty app">
      <div className="bapp-island" aria-hidden />
      <div className="bapp-status mono" aria-hidden>
        <span>9:41</span>
        <span className="bapp-status-icons">
          <svg viewBox="0 0 16 10" width="15"><path d="M1 9h2V6H1v3Zm4 0h2V4H5v5Zm4 0h2V2H9v7Zm4 0h2V0h-2v9Z" fill="currentColor" /></svg>
          <svg viewBox="0 0 22 10" width="20"><rect x="0.5" y="0.5" width="18" height="9" rx="2.5" fill="none" stroke="currentColor" /><rect x="2" y="2" width="13" height="6" rx="1.2" fill="currentColor" /><path d="M20.5 3.5v3a1.8 1.8 0 0 0 0-3Z" fill="currentColor" /></svg>
        </span>
      </div>

      <div className="bapp-screen">
        {tab === "card" && (
          <div className="bapp-view" key="card">
            <div className="bapp-brandrow">
              <span className="bapp-logo" aria-hidden />
              <b>Corner Coffee</b>
            </div>
            <p className="bapp-greet">Good morning, Aisyah</p>

            <div className="bapp-card">
              <div className="bapp-card-head">
                <b>Coffee card</b>
                <span className="mono">
                  {STAMPS} of {TOTAL}
                </span>
              </div>
              <div className="bapp-grid" aria-hidden>
                {Array.from({ length: TOTAL }, (_, i) => (
                  <span key={i} className={`bapp-stamp${i < STAMPS ? " on" : ""}`}>
                    <svg viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="34" fill="none" stroke="var(--coral)" strokeWidth="11" />
                      <circle cx="48" cy="48" r="13" fill="var(--coral)" />
                    </svg>
                  </span>
                ))}
              </div>
              <p className="bapp-card-foot">2 more for a free coffee</p>
            </div>

            <button type="button" className="bapp-btn" onClick={() => setQrOpen(true)}>
              Show QR to collect stamps
            </button>
            <p className="bapp-points mono">Points balance: {POINTS}</p>

            <p className="bapp-seclabel mono">Recent</p>
            <div className="bapp-rows">
              <div className="bapp-row">
                <span>Stamp 8 of 10 &middot; SS2 outlet</span>
                <span className="mono">8:02 am</span>
              </div>
              <div className="bapp-row">
                <span>18 points earned</span>
                <span className="mono">8:02 am</span>
              </div>
            </div>
          </div>
        )}

        {tab === "rewards" && (
          <div className="bapp-view" key="rewards">
            <p className="bapp-greet">Treat yourself</p>
            <p className="bapp-points mono">Points balance: {POINTS}</p>
            <div className="bapp-rows">
              {REWARDS.map((r) => {
                const can = POINTS >= r.pts;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className="bapp-row bapp-reward"
                    disabled={!can}
                    onClick={() => setCouponFor(r.id)}
                  >
                    <span>
                      <b>{r.name}</b>
                      <small>{can ? "Tap to redeem" : `${r.pts - POINTS} more points to go`}</small>
                    </span>
                    <span className="bapp-pts mono">{r.pts} pts</span>
                  </button>
                );
              })}
            </div>
            <p className="bapp-sheet-note">Redeeming opens a single use code that staff confirm at the counter.</p>
          </div>
        )}

        {tab === "you" && (
          <div className="bapp-view" key="you">
            <p className="bapp-greet">Aisyah Rahman</p>
            <div className="bapp-rows">
              <div className="bapp-row">
                <span>Phone</span>
                <span className="mono">verified</span>
              </div>
              <div className="bapp-row">
                <span>Birthday</span>
                <span className="mono">12 March</span>
              </div>
              <button
                type="button"
                className="bapp-row bapp-togglerow"
                aria-pressed={optIn}
                onClick={() => setOptIn((v) => !v)}
              >
                <span>News and treats</span>
                <span className={`bapp-toggle${optIn ? " on" : ""}`} aria-hidden />
              </button>
              <div className="bapp-row">
                <span>Export my data</span>
                <span className="mono">free</span>
              </div>
            </div>
            <p className="bapp-seclabel mono">Messages</p>
            <div className="bapp-rows">
              <div className="bapp-row bapp-msg">
                <span>
                  <b>A little birthday treat</b>
                  <small>Your slice of cake is waiting this week.</small>
                </span>
              </div>
              <div className="bapp-row bapp-msg">
                <span>
                  <b>We miss you</b>
                  <small>Two stamps to go. The coffee is still warm.</small>
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      <nav className="bapp-tabs" aria-label="Demo app sections">
        <button type="button" className={tab === "card" ? "on" : ""} onClick={() => setTab("card")}>
          <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="8.5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="15.5" cy="12" r="1.4" fill="currentColor" /></svg>
          Card
        </button>
        <button type="button" className={tab === "rewards" ? "on" : ""} onClick={() => setTab("rewards")}>
          <svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 12h16M12 9v11M12 9c-3 0-4.5-1.2-4.5-2.7C7.5 4.9 9 4.4 10 5c1.2.7 2 4 2 4s.8-3.3 2-4c1-.6 2.5-.1 2.5 1.3C16.5 7.8 15 9 12 9Z" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          Rewards
        </button>
        <button type="button" className={tab === "you" ? "on" : ""} onClick={() => setTab("you")}>
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          You
        </button>
      </nav>
      <div className="bapp-homebar" aria-hidden />

      {/* sheets sit at phone level so they cover the tab bar, like a real app */}
      {qrOpen && <QrSheet onClose={() => setQrOpen(false)} />}
      {couponFor && <CouponSheet onClose={() => setCouponFor(null)} />}
    </div>
  );
}
