"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* An interactive mock of a branded loyalty app, rendered as a phone.
 *
 * Design only: no app code exists (APP.md Stage 1). Every flow has a start
 * and an end: onboarding -> OTP (demo code 888888, mirroring the dev
 * bypass) -> registration -> home, then scan, redeem, history, profile
 * edit, sign out and delete account. The screens mirror the real customer
 * PWA so the demo never promises flows the product does not have. Coral
 * stays the earned colour; the brand colour dresses the chrome (BRAND.md). */

const TOTAL = 10;
const DEMO_OTP = "888888";
const COUPON_SECONDS = 15 * 60;
const SCAN_DELAY = 2400;
const CONFIRM_DELAY = 4200;

type Phase =
  | "splash"
  | "welcome"
  | "phone"
  | "otp"
  | "register"
  | "push"
  | "home"
  | "deleted"
  | "offline"
  | "update"
  | "sunset";

type Tab = "card" | "rewards" | "activity" | "you";
type ActivityKind = "stamp" | "points" | "reward";

interface Profile {
  name: string;
  email: string;
  birthday: string;
  optIn: boolean;
  pushOn: boolean;
}

interface ActivityRow {
  id: number;
  kind: ActivityKind;
  label: string;
  time: string;
}

interface RedeemedRow {
  id: number;
  name: string;
  pts: number;
  time: string;
}

const EMPTY_PROFILE: Profile = { name: "", email: "", birthday: "", optIn: false, pushOn: false };

const SEED_PROFILE: Profile = {
  name: "Aisyah Rahman",
  email: "aisyah@example.com",
  birthday: "1996-03-12",
  optIn: true,
  pushOn: true,
};

const REWARDS = [
  { id: "pastry", name: "Pastry of the day", pts: 80 },
  { id: "coffee", name: "Free coffee of your choice", pts: 120 },
  { id: "tote", name: "Corner Coffee tote", pts: 250 },
];

function fmtTime(d: Date) {
  let h = d.getHours();
  const suffix = h < 12 ? "am" : "pm";
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${suffix}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ---------- sheets ---------- */

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="bapp-sheetwrap" onClick={onClose}>
      <div className="bapp-sheet" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function QrSheet({ onScanned, onClose }: { onScanned: () => void; onClose: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onScanned, SCAN_DELAY);
    return () => window.clearTimeout(t);
    // deps stay empty on purpose: one scan simulation per open
  }, []);
  return (
    <Sheet onClose={onClose}>
      <p className="bapp-sheet-label mono">Your member code</p>
      <img className="bapp-qr" src="/showcase/qr-join.svg" alt="" aria-hidden />
      <p className="bapp-sheet-note">Staff scan this to add your stamp.</p>
      <p className="bapp-scanhint mono">Demo: the cashier scans in a moment</p>
      <button type="button" className="bapp-btn bapp-btn-ghost" onClick={onClose}>
        Close
      </button>
    </Sheet>
  );
}

function CouponSheet({
  reward,
  onConfirmed,
  onClose,
}: {
  reward: { name: string; pts: number };
  onConfirmed: () => void;
  onClose: (confirmed: boolean) => void;
}) {
  const [left, setLeft] = useState(COUPON_SECONDS);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const tick = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    const confirm = window.setTimeout(() => {
      setConfirmed(true);
      onConfirmed();
    }, CONFIRM_DELAY);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(confirm);
    };
    // deps stay empty on purpose: one coupon lifecycle per open
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <Sheet onClose={() => onClose(confirmed)}>
      <p className="bapp-sheet-label mono">Reward coupon</p>
      {confirmed ? (
        <>
          <span className="bapp-confirmmark" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </span>
          <p className="bapp-code mono">Confirmed</p>
          <p className="bapp-sheet-note">
            {reward.name} is yours. {reward.pts} points came off your balance.
          </p>
        </>
      ) : (
        <>
          <p className="bapp-code mono">KMB-7F2K-QX3D</p>
          <p className="bapp-timer mono">
            Single use &middot; expires in {mm}:{ss}
          </p>
          <p className="bapp-sheet-note">Show this at the counter. Points come off when staff confirm.</p>
          <p className="bapp-scanhint mono">Demo: the cashier confirms in a moment</p>
        </>
      )}
      <button type="button" className="bapp-btn bapp-btn-ghost" onClick={() => onClose(confirmed)}>
        {confirmed ? "Done" : "Close"}
      </button>
    </Sheet>
  );
}

function ConfirmSheet({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <p className="bapp-sheet-label mono">{title}</p>
      <p className="bapp-sheet-note">{body}</p>
      <div className="bapp-sheet-actions">
        <button
          type="button"
          className={`bapp-btn${danger ? " bapp-btn-danger" : ""}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
        <button type="button" className="bapp-btn bapp-btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

function EditSheet({
  profile,
  onSave,
  onClose,
}: {
  profile: Profile;
  onSave: (p: Pick<Profile, "name" | "email" | "birthday">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [birthday, setBirthday] = useState(profile.birthday);
  return (
    <Sheet onClose={onClose}>
      <p className="bapp-sheet-label mono">Edit profile</p>
      <div className="bapp-form">
        <label>
          <span>Full name</span>
          <input type="text" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span>Email, optional</span>
          <input type="email" value={email} maxLength={60} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span>Birthday, optional</span>
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </label>
      </div>
      <div className="bapp-sheet-actions">
        <button
          type="button"
          className="bapp-btn"
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), email: email.trim(), birthday })}
        >
          Save changes
        </button>
        <button type="button" className="bapp-btn bapp-btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

/* ---------- onboarding screens ---------- */

function PhoneScreen({
  initial,
  onNext,
  onBack,
}: {
  initial: string;
  onNext: (phone: string) => void;
  onBack: () => void;
}) {
  const [value, setValue] = useState(initial);
  const digits = value.replace(/\D/g, "");
  const valid = digits.length >= 8;
  return (
    <div className="bapp-view bapp-onboard">
      <button type="button" className="bapp-back mono" onClick={onBack}>
        &larr; Back
      </button>
      <p className="bapp-greet">Your phone number is your card</p>
      <p className="bapp-onboard-sub">We send a six digit code to check it is you.</p>
      <div className="bapp-form">
        <label>
          <span>Phone number</span>
          <div className="bapp-phonefield">
            <span className="mono">+60</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="12 345 6789"
              value={value}
              maxLength={14}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </label>
      </div>
      <button type="button" className="bapp-btn" disabled={!valid} onClick={() => onNext(value)}>
        Send the code
      </button>
      <p className="bapp-scanhint mono">Demo: any number works</p>
    </div>
  );
}

function OtpScreen({
  phone,
  onVerified,
  onBack,
}: {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [cooldown, setCooldown] = useState(20);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (code.length !== 6) return;
    if (code === DEMO_OTP) {
      onVerified();
    } else {
      setError(true);
      setCode("");
    }
    // deps track only the code on purpose: verify exactly when six digits land
  }, [code]);

  return (
    <div className="bapp-view bapp-onboard">
      <button type="button" className="bapp-back mono" onClick={onBack}>
        &larr; Change number
      </button>
      <p className="bapp-greet">Enter the code</p>
      <p className="bapp-onboard-sub">Sent to +60 {phone || "12 345 6789"}.</p>
      <input
        className={`bapp-otp-input mono${error ? " err" : ""}`}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
        value={code}
        maxLength={6}
        onChange={(e) => {
          setError(false);
          setCode(e.target.value.replace(/\D/g, ""));
        }}
      />
      {error && <p className="bapp-err">That code does not match. Try again.</p>}
      <button
        type="button"
        className="bapp-btn bapp-btn-ghost"
        disabled={cooldown > 0}
        onClick={() => {
          setCooldown(20);
          setResent(true);
        }}
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : resent ? "Send again" : "Resend code"}
      </button>
      <p className="bapp-scanhint mono">Demo code: 888888</p>
    </div>
  );
}

function RegisterScreen({ onDone }: { onDone: (p: Pick<Profile, "name" | "email" | "birthday" | "optIn">) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [optIn, setOptIn] = useState(false);
  return (
    <div className="bapp-view bapp-onboard">
      <p className="bapp-greet">Nearly there</p>
      <p className="bapp-onboard-sub">So the counter knows who the card belongs to.</p>
      <div className="bapp-form">
        <label>
          <span>Full name</span>
          <input type="text" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span>Email, optional</span>
          <input type="email" value={email} maxLength={60} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span>Birthday, optional</span>
          <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
        </label>
        <label className="bapp-checkrow">
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
          <span>Send me news and treats. Optional, off unless you tick it.</span>
        </label>
      </div>
      <button
        type="button"
        className="bapp-btn"
        disabled={!name.trim()}
        onClick={() => onDone({ name: name.trim(), email: email.trim(), birthday, optIn })}
      >
        Save and continue
      </button>
    </div>
  );
}

/* ---------- the demo ---------- */

export function BrandAppDemo({ showStatePreviews = false }: { showStatePreviews?: boolean }) {
  const [phase, setPhase] = useState<Phase>("splash");
  const [tab, setTab] = useState<Tab>("card");
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [registered, setRegistered] = useState(false);
  const [phone, setPhone] = useState("");
  const [stamps, setStamps] = useState(0);
  const [points, setPoints] = useState(0);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [redeemed, setRedeemed] = useState<RedeemedRow[]>([]);
  const [filter, setFilter] = useState<"all" | ActivityKind>("all");
  const [banner, setBanner] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [couponFor, setCouponFor] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"edit" | "export" | "signout" | "delete" | null>(null);

  const idRef = useRef(1);
  // where a state preview (offline, update, sunset) should return to
  const beforePreviewRef = useRef<Phase>("welcome");
  const timersRef = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const showBanner = useCallback(
    (text: string) => {
      setBanner(text);
      later(() => setBanner((b) => (b === text ? null : b)), 2600);
    },
    [later]
  );

  const pushActivity = useCallback((kind: ActivityKind, label: string) => {
    setActivity((a) => [{ id: idRef.current++, kind, label, time: fmtTime(new Date()) }, ...a]);
  }, []);

  useEffect(() => {
    if (phase !== "splash") return;
    const t = window.setTimeout(() => setPhase("welcome"), 1000);
    return () => window.clearTimeout(t);
  }, [phase]);

  const firstName = profile.name.split(" ")[0] || "there";

  const seedAndEnter = () => {
    setProfile(SEED_PROFILE);
    setRegistered(true);
    setPhone("12 345 6789");
    setStamps(8);
    setPoints(87);
    const seed: ActivityRow[] = [
      { id: idRef.current++, kind: "points", label: "18 points earned · RM 18.00", time: "8:02 am" },
      { id: idRef.current++, kind: "stamp", label: "Stamp 8 of 10 · SS2 outlet", time: "8:02 am" },
    ];
    setActivity(seed);
    setPhase("home");
    setTab("card");
  };

  const enterPreview = (p: Phase) => {
    if (phase !== "offline" && phase !== "update" && phase !== "sunset") {
      beforePreviewRef.current = phase === "splash" ? "welcome" : phase;
    }
    setPhase(p);
  };

  const resetAll = () => {
    setProfile(EMPTY_PROFILE);
    setRegistered(false);
    setPhone("");
    setStamps(0);
    setPoints(0);
    setActivity([]);
    setRedeemed([]);
    setBanner(null);
    setTab("card");
    setPhase("splash");
  };

  const handleScanned = () => {
    setQrOpen(false);
    const next = stamps + 1;
    pushActivity("stamp", `Stamp ${next} of ${TOTAL} · SS2 outlet`);
    pushActivity("points", "12 points earned · RM 12.00");
    setPoints((p) => p + 12);
    if (next >= TOTAL) {
      setStamps(TOTAL);
      showBanner("Card full: a free coffee is yours");
      pushActivity("reward", "Free coffee earned · card full");
      later(() => {
        setStamps(0);
        showBanner("A fresh card has started");
      }, 2200);
    } else {
      setStamps(next);
      showBanner(`Stamp landed: ${next} of ${TOTAL}`);
    }
  };

  const activeReward = REWARDS.find((r) => r.id === couponFor);

  const handleConfirmed = () => {
    if (!activeReward) return;
    setPoints((p) => Math.max(0, p - activeReward.pts));
    setRedeemed((r) => [
      { id: idRef.current++, name: activeReward.name, pts: activeReward.pts, time: fmtTime(new Date()) },
      ...r,
    ]);
    pushActivity("reward", `${activeReward.name} redeemed · ${activeReward.pts} points`);
  };

  const filtered = filter === "all" ? activity : activity.filter((a) => a.kind === filter);

  const inApp = phase === "home";

  return (
    <div className="bapp-wrap">
    <div className="bapp-phone" role="group" aria-label="A demo of a branded loyalty app">
      <div className="bapp-island" aria-hidden />
      {/* one rounded, clipping container for the whole screen stack: per-piece
          corner radii get clamped on short elements (the homebar is ~19px, so a
          36px radius distorts) and the screen never hugs the frame corner */}
      <div className="bapp-inner">
      <div className="bapp-status mono" aria-hidden>
        <span>9:41</span>
        <span className="bapp-status-icons">
          <svg viewBox="0 0 16 10" width="15"><path d="M1 9h2V6H1v3Zm4 0h2V4H5v5Zm4 0h2V2H9v7Zm4 0h2V0h-2v9Z" fill="currentColor" /></svg>
          <svg viewBox="0 0 22 10" width="20"><rect x="0.5" y="0.5" width="18" height="9" rx="2.5" fill="none" stroke="currentColor" /><rect x="2" y="2" width="13" height="6" rx="1.2" fill="currentColor" /><path d="M20.5 3.5v3a1.8 1.8 0 0 0 0-3Z" fill="currentColor" /></svg>
        </span>
      </div>

      {banner && (
        <div className="bapp-banner" role="status">
          <span className="bapp-logo bapp-logo-sm" aria-hidden />
          <span>{banner}</span>
        </div>
      )}

      <div className="bapp-screen">
        {phase === "splash" && (
          <div className="bapp-view bapp-center" key="splash">
            <span className="bapp-logo bapp-logo-lg" aria-hidden />
            <p className="bapp-splash-word">Corner Coffee</p>
          </div>
        )}

        {phase === "welcome" && (
          <div className="bapp-view bapp-center" key="welcome">
            <span className="bapp-logo bapp-logo-lg" aria-hidden />
            <p className="bapp-greet">Your stamps live here now</p>
            <p className="bapp-onboard-sub">
              Every visit counted, every reward kept. Nothing to print, nothing to lose.
            </p>
            <button type="button" className="bapp-btn" onClick={() => setPhase("phone")}>
              Get started
            </button>
            <button type="button" className="bapp-btn bapp-btn-ghost" onClick={seedAndEnter}>
              Skip to the card
            </button>
          </div>
        )}

        {phase === "phone" && (
          <PhoneScreen
            key="phone"
            initial={phone}
            onBack={() => setPhase("welcome")}
            onNext={(p) => {
              setPhone(p);
              setPhase("otp");
            }}
          />
        )}

        {phase === "otp" && (
          <OtpScreen
            key="otp"
            phone={phone}
            onBack={() => setPhase("phone")}
            onVerified={() => {
              if (registered) {
                setTab("card");
                setPhase("home");
                showBanner(`Welcome back, ${firstName}`);
              } else {
                setPhase("register");
              }
            }}
          />
        )}

        {phase === "register" && (
          <RegisterScreen
            key="register"
            onDone={(p) => {
              setProfile((prev) => ({ ...prev, ...p }));
              setRegistered(true);
              setPhase("push");
            }}
          />
        )}

        {phase === "push" && (
          <div className="bapp-view bapp-center" key="push">
            <span className="bapp-bellmark" aria-hidden>
              <svg viewBox="0 0 24 24">
                <path d="M12 3.5c-3.2 0-5.3 2.3-5.3 5.4v3.3L5 15.3v1.2h14v-1.2l-1.7-3.1V8.9c0-3.1-2.1-5.4-5.3-5.4Zm-1.8 14.6a1.9 1.9 0 0 0 3.6 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="bapp-greet">Know the moment a stamp lands?</p>
            <p className="bapp-onboard-sub">We only send what matters: stamps, rewards, and your coupon confirmations.</p>
            <button
              type="button"
              className="bapp-btn"
              onClick={() => {
                setProfile((p) => ({ ...p, pushOn: true }));
                setTab("card");
                setPhase("home");
                showBanner(`Welcome, ${firstName}`);
              }}
            >
              Turn on notifications
            </button>
            <button
              type="button"
              className="bapp-btn bapp-btn-ghost"
              onClick={() => {
                setTab("card");
                setPhase("home");
                showBanner(`Welcome, ${firstName}`);
              }}
            >
              Not now
            </button>
          </div>
        )}

        {phase === "deleted" && (
          <div className="bapp-view bapp-center" key="deleted">
            <p className="bapp-greet">Account deleted</p>
            <p className="bapp-onboard-sub">
              Your profile is gone. Stamps already given stay in the shop's ledger, without your name.
            </p>
            <button type="button" className="bapp-btn bapp-btn-ghost" onClick={resetAll}>
              Start over
            </button>
          </div>
        )}

        {phase === "offline" && (
          <div className="bapp-view bapp-center" key="offline">
            <p className="bapp-sheet-label mono">No connection</p>
            <p className="bapp-greet">You are offline</p>
            <p className="bapp-onboard-sub">
              Your {stamps} of {TOTAL} stamps are safe. The QR needs a connection, so ask staff to find you by phone number.
            </p>
            <button type="button" className="bapp-btn bapp-btn-ghost" onClick={() => setPhase(beforePreviewRef.current)}>
              Back to the demo
            </button>
          </div>
        )}

        {phase === "update" && (
          <div className="bapp-view bapp-center" key="update">
            <p className="bapp-sheet-label mono">Update needed</p>
            <p className="bapp-greet">A newer version is ready</p>
            <p className="bapp-onboard-sub">This version is out of date. Update to keep collecting stamps.</p>
            <button type="button" className="bapp-btn" onClick={() => setPhase(beforePreviewRef.current)}>
              Update now
            </button>
          </div>
        )}

        {phase === "sunset" && (
          <div className="bapp-view bapp-center" key="sunset">
            <p className="bapp-sheet-label mono">Program ended</p>
            <p className="bapp-greet">Thank you for coming back</p>
            <p className="bapp-onboard-sub">
              Corner Coffee has ended its loyalty program. You can export your visit history until 18 August.
            </p>
            <button type="button" className="bapp-btn" onClick={() => setPhase(beforePreviewRef.current)}>
              Export my data
            </button>
            <button type="button" className="bapp-btn bapp-btn-ghost" onClick={() => setPhase(beforePreviewRef.current)}>
              Back to the demo
            </button>
          </div>
        )}

        {inApp && tab === "card" && (
          <div className="bapp-view" key="card">
            <div className="bapp-brandrow">
              <span className="bapp-logo" aria-hidden />
              <b>Corner Coffee</b>
            </div>
            <p className="bapp-greet">
              {greeting()}, {firstName}
            </p>

            <div className="bapp-card">
              <div className="bapp-card-head">
                <b>Coffee card</b>
                <span className="mono">
                  {stamps} of {TOTAL}
                </span>
              </div>
              <div className="bapp-grid" aria-hidden>
                {Array.from({ length: TOTAL }, (_, i) => (
                  <span key={i} className={`bapp-stamp${i < stamps ? " on" : ""}`}>
                    <svg viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="34" fill="none" stroke="var(--coral)" strokeWidth="11" />
                      <circle cx="48" cy="48" r="13" fill="var(--coral)" />
                    </svg>
                  </span>
                ))}
              </div>
              <p className="bapp-card-foot">
                {stamps >= TOTAL
                  ? "Card full: a free coffee is on the house"
                  : `${TOTAL - stamps} more for a free coffee`}
              </p>
            </div>

            <button type="button" className="bapp-btn" onClick={() => setQrOpen(true)}>
              Show QR to collect stamps
            </button>
            <p className="bapp-points mono">Points balance: {points}</p>

            <div className="bapp-secrow">
              <p className="bapp-seclabel mono">Recent</p>
              {activity.length > 2 && (
                <button type="button" className="bapp-seelink mono" onClick={() => setTab("activity")}>
                  See all
                </button>
              )}
            </div>
            <div className="bapp-rows">
              {activity.length === 0 && (
                <p className="bapp-empty">Show your QR at the counter and your first stamp lands here.</p>
              )}
              {activity.slice(0, 2).map((a) => (
                <div key={a.id} className="bapp-row">
                  <span>{a.label}</span>
                  <span className="mono">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {inApp && tab === "rewards" && (
          <div className="bapp-view" key="rewards">
            <p className="bapp-greet">Treat yourself</p>
            <p className="bapp-points mono">Points balance: {points}</p>
            <div className="bapp-rows">
              {REWARDS.map((r) => {
                const can = points >= r.pts;
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
                      <small>{can ? "Tap to redeem" : `${r.pts - points} more points to go`}</small>
                    </span>
                    <span className="bapp-pts mono">{r.pts} pts</span>
                  </button>
                );
              })}
            </div>
            {redeemed.length > 0 && (
              <>
                <p className="bapp-seclabel mono">Redeemed</p>
                <div className="bapp-rows">
                  {redeemed.map((r) => (
                    <div key={r.id} className="bapp-row">
                      <span>{r.name}</span>
                      <span className="mono">{r.time}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <p className="bapp-sheet-note">Redeeming opens a single use code that staff confirm at the counter.</p>
          </div>
        )}

        {inApp && tab === "activity" && (
          <div className="bapp-view" key="activity">
            <p className="bapp-greet">Every visit, counted</p>
            <div className="bapp-filters" role="tablist" aria-label="Filter activity">
              {(["all", "stamp", "points", "reward"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`bapp-filter mono${filter === f ? " on" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All" : f === "stamp" ? "Stamps" : f === "points" ? "Points" : "Rewards"}
                </button>
              ))}
            </div>
            <div className="bapp-rows">
              {filtered.length === 0 && (
                <p className="bapp-empty">
                  {activity.length === 0
                    ? "Your first stamp will appear here."
                    : "Nothing of this kind yet."}
                </p>
              )}
              {filtered.map((a) => (
                <div key={a.id} className="bapp-row">
                  <span>{a.label}</span>
                  <span className="mono">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {inApp && tab === "you" && (
          <div className="bapp-view" key="you">
            <p className="bapp-greet">{profile.name || "Your profile"}</p>
            <div className="bapp-rows">
              <div className="bapp-row">
                <span>
                  Phone
                  <small className="bapp-rowsub">Ask at the counter to change</small>
                </span>
                <span className="mono">+60 {phone || "12 345 6789"}</span>
              </div>
              <button type="button" className="bapp-row bapp-reward" onClick={() => setSheet("edit")}>
                <span>
                  <b>Edit profile</b>
                  <small>
                    {profile.email || "No email"} &middot; {profile.birthday || "no birthday"}
                  </small>
                </span>
                <span className="mono">&rsaquo;</span>
              </button>
              <button
                type="button"
                className="bapp-row bapp-togglerow"
                aria-pressed={profile.optIn}
                onClick={() => setProfile((p) => ({ ...p, optIn: !p.optIn }))}
              >
                <span>News and treats</span>
                <span className={`bapp-toggle${profile.optIn ? " on" : ""}`} aria-hidden />
              </button>
              <button
                type="button"
                className="bapp-row bapp-togglerow"
                aria-pressed={profile.pushOn}
                onClick={() => setProfile((p) => ({ ...p, pushOn: !p.pushOn }))}
              >
                <span>Push notifications</span>
                <span className={`bapp-toggle${profile.pushOn ? " on" : ""}`} aria-hidden />
              </button>
              <button type="button" className="bapp-row bapp-reward" onClick={() => setSheet("export")}>
                <span>
                  <b>Export my data</b>
                  <small>Free, always</small>
                </span>
                <span className="mono">&rsaquo;</span>
              </button>
            </div>
            <p className="bapp-seclabel mono">Account</p>
            <div className="bapp-rows">
              <button type="button" className="bapp-row bapp-reward" onClick={() => setSheet("signout")}>
                <span>Sign out</span>
              </button>
              <button
                type="button"
                className="bapp-row bapp-reward bapp-dangerrow"
                onClick={() => setSheet("delete")}
              >
                <span>Delete account</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {inApp && (
        <nav className="bapp-tabs" aria-label="Demo app sections">
          <button type="button" className={tab === "card" ? "on" : ""} onClick={() => setTab("card")}>
            <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="8.5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="15.5" cy="12" r="1.4" fill="currentColor" /></svg>
            Card
          </button>
          <button type="button" className={tab === "rewards" ? "on" : ""} onClick={() => setTab("rewards")}>
            <svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 12h16M12 9v11M12 9c-3 0-4.5-1.2-4.5-2.7C7.5 4.9 9 4.4 10 5c1.2.7 2 4 2 4s.8-3.3 2-4c1-.6 2.5-.1 2.5 1.3C16.5 7.8 15 9 12 9Z" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
            Rewards
          </button>
          <button type="button" className={tab === "activity" ? "on" : ""} onClick={() => setTab("activity")}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5V12l3 2.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            Activity
          </button>
          <button type="button" className={tab === "you" ? "on" : ""} onClick={() => setTab("you")}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20c1.2-3.4 3.8-5 7-5s5.8 1.6 7 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            You
          </button>
        </nav>
      )}
      <div className="bapp-homebar" aria-hidden />

      {/* sheets cover the tab bar too, like a real app; the inner clips them */}
      {qrOpen && <QrSheet onScanned={handleScanned} onClose={() => setQrOpen(false)} />}
      {couponFor && activeReward && (
        <CouponSheet
          reward={activeReward}
          onConfirmed={handleConfirmed}
          onClose={(confirmed) => {
            setCouponFor(null);
            if (!confirmed) showBanner("Coupon closed. Your points were not taken.");
          }}
        />
      )}
      {sheet === "edit" && (
        <EditSheet
          profile={profile}
          onClose={() => setSheet(null)}
          onSave={(p) => {
            setProfile((prev) => ({ ...prev, ...p }));
            setSheet(null);
            showBanner("Profile saved");
          }}
        />
      )}
      {sheet === "export" && (
        <ConfirmSheet
          title="Export my data"
          body="We prepare your visits, points and profile as a file and email it to you within one day. Free, always."
          confirmLabel="Send my data"
          onConfirm={() => {
            setSheet(null);
            showBanner("Export requested. Check your email soon.");
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "signout" && (
        <ConfirmSheet
          title="Sign out"
          body="Your card and points stay safe. Sign back in with your phone number any time."
          confirmLabel="Sign out"
          onConfirm={() => {
            setSheet(null);
            setPhase("phone");
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "delete" && (
        <ConfirmSheet
          title="Delete account"
          body="This removes your profile and card from Corner Coffee. Stamps already given stay in the shop's ledger, without your name. This cannot be undone."
          confirmLabel="Delete my account"
          danger
          onConfirm={() => {
            setSheet(null);
            setPhase("deleted");
          }}
          onClose={() => setSheet(null)}
        />
      )}
      </div>
    </div>

    {showStatePreviews && (
      <p className="bapp-previews mono">
        Preview:{" "}
        <button type="button" onClick={() => enterPreview("offline")}>offline</button> &middot;{" "}
        <button type="button" onClick={() => enterPreview("update")}>update</button> &middot;{" "}
        <button type="button" onClick={() => enterPreview("sunset")}>program end</button> &middot;{" "}
        <button type="button" onClick={resetAll}>restart</button>
      </p>
    )}
    </div>
  );
}
