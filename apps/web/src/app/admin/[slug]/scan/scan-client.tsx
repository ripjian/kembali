"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { setServingOutlet } from "@/lib/admin-actions";

interface Outlet {
  id: string;
  name: string;
}

/* Counter flow, two jobs two buttons (Phase 2):
 *  - Scan member: customer QR → optional amount → stamp + points.
 *  - Scan reward: coupon QR/code → see which reward & member → confirm.
 * Camera scanning uses the native BarcodeDetector where supported, with a
 * paste/type fallback that works everywhere. */

interface StampResult {
  customerName: string;
  stampsCount: number;
  stampsRequired: number;
  stampsRemaining: number;
  rewardEarned: boolean;
  pointsEarned: number;
  pointsBalance: number;
}

interface CouponInfo {
  code: string;
  state: "reserved" | "redeemed" | "expired" | "cancelled";
  title: string;
  customerName: string;
  pointsCost: number;
  balanceOk: boolean;
}

interface ConfirmResult {
  title: string;
  customerName: string;
  pointsCost: number;
  newBalance: number;
}

type BarcodeDetectorLike = {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
};

type CameraState = "idle" | "on" | "unsupported" | "denied";

function useCamera(onCode: (value: string) => Promise<void>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>("idle");
  const stopRef = useRef<() => void>(() => {});
  const busyRef = useRef(false);

  async function start() {
    const Detector = (
      globalThis as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }
    ).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setState("on");
      const detector = new Detector({ formats: ["qr_code"] });
      let raf = 0;
      const tick = async () => {
        if (!busyRef.current && video.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue;
            if (value) {
              busyRef.current = true;
              await onCode(value);
              busyRef.current = false;
            }
          } catch {
            /* detection errors are transient - keep scanning */
          }
        }
        raf = requestAnimationFrame(() => void tick());
      };
      raf = requestAnimationFrame(() => void tick());
      stopRef.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        setState("idle");
      };
    } catch {
      setState("denied");
    }
  }

  useEffect(() => () => stopRef.current(), []);
  return { videoRef, state, start, stop: () => stopRef.current() };
}

function CameraBox({
  hint,
  camera,
}: {
  hint: string;
  camera: ReturnType<typeof useCamera>;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">Camera scan</p>
        {camera.state !== "on" ? (
          <button
            type="button"
            onClick={() => void camera.start()}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover"
          >
            Start camera
          </button>
        ) : (
          <button
            type="button"
            onClick={camera.stop}
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface-alt"
          >
            Stop
          </button>
        )}
      </div>
      <video
        ref={camera.videoRef}
        muted
        playsInline
        className={`mt-3 aspect-video w-full rounded-xl bg-surface-alt object-cover ${
          camera.state === "on" ? "" : "hidden"
        }`}
      />
      {camera.state === "unsupported" && (
        <p className="mt-2 text-xs text-text-muted">
          This browser can&apos;t scan directly. {hint}
        </p>
      )}
      {camera.state === "denied" && (
        <p className="mt-2 text-xs text-text-muted">
          Camera access was blocked. Allow it in the browser settings, or {hint.toLowerCase()}
        </p>
      )}
    </div>
  );
}

const bigButton =
  "flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-8 text-center hover:border-primary hover:bg-surface-alt";

export function ScanClient({
  tenantId,
  canRedeem,
  outlets,
  servingOutletId,
}: {
  tenantId: string;
  canRedeem: boolean;
  /** Empty for single-outlet tenants (no picker needed). */
  outlets: Outlet[];
  servingOutletId: string | null;
}) {
  const [mode, setMode] = useState<"member" | "reward" | null>(null);
  const multiOutlet = outlets.length > 1;

  // Multi-outlet, not chosen yet today → ask before scanning.
  if (multiOutlet && !servingOutletId) {
    return <OutletPrompt tenantId={tenantId} outlets={outlets} />;
  }

  const outletBar = multiOutlet ? (
    <OutletBar
      tenantId={tenantId}
      outlets={outlets}
      servingOutletId={servingOutletId!}
    />
  ) : null;

  if (mode === "member") {
    return (
      <>
        {outletBar}
        <MemberScan onBack={() => setMode(null)} showBack={canRedeem} />
      </>
    );
  }
  if (mode === "reward") {
    return (
      <>
        {outletBar}
        <RewardScan tenantId={tenantId} onBack={() => setMode(null)} />
      </>
    );
  }
  if (!canRedeem) {
    // Only one job available - skip the chooser.
    return (
      <>
        {outletBar}
        <MemberScan onBack={() => {}} showBack={false} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {outletBar}
      <div className="grid gap-3 sm:grid-cols-2" data-scan-chooser>
      <button type="button" onClick={() => setMode("member")} className={bigButton}>
        <span className="text-3xl" aria-hidden>
          🪪
        </span>
        <span className="text-base font-semibold text-text">Scan member</span>
        <span className="text-xs text-text-muted">
          Stamp their card and add points from the sale
        </span>
      </button>
      <button type="button" onClick={() => setMode("reward")} className={bigButton}>
        <span className="text-3xl" aria-hidden>
          🎁
        </span>
        <span className="text-base font-semibold text-text">Scan reward</span>
        <span className="text-xs text-text-muted">
          Check a coupon and confirm the redemption
        </span>
      </button>
      </div>
    </div>
  );
}

/* ---- serving outlet of the day ------------------------------------------- */

function OutletPrompt({ tenantId, outlets }: { tenantId: string; outlets: Outlet[] }) {
  return (
    <form
      action={setServingOutlet}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6"
    >
      <input type="hidden" name="tenantId" value={tenantId} />
      <div>
        <h2 className="text-base font-semibold text-text">
          Choose today&apos;s outlet
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          We&apos;ll tag today&apos;s stamps and rewards to it. You can switch
          anytime.
        </p>
      </div>
      <select
        name="outletId"
        required
        defaultValue=""
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
      >
        <option value="" disabled>
          Choose an outlet…
        </option>
        {outlets.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <button className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
        Start serving here
      </button>
    </form>
  );
}

function OutletBar({
  tenantId,
  outlets,
  servingOutletId,
}: {
  tenantId: string;
  outlets: Outlet[];
  servingOutletId: string;
}) {
  const current = outlets.find((o) => o.id === servingOutletId);
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface-alt px-4 py-2.5"
      data-outlet-bar
    >
      <p className="text-sm text-text-secondary">
        You&apos;re serving at{" "}
        <span className="font-semibold text-text" data-serving-outlet>
          {current?.name ?? "an outlet"}
        </span>
      </p>
      <form action={setServingOutlet} className="flex items-center gap-2">
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="sr-only" htmlFor="switch-outlet">
          Switch outlet
        </label>
        <select
          id="switch-outlet"
          name="outletId"
          defaultValue={servingOutletId}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-text outline-none focus:border-primary"
        >
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="self-start text-xs font-medium text-text-muted hover:text-text"
    >
      ← Back to scan options
    </button>
  );
}

/* ---- member: stamp + points ---------------------------------------------- */

function MemberScan({ onBack, showBack }: { onBack: () => void; showBack: boolean }) {
  const router = useRouter();
  const [manualToken, setManualToken] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StampResult | null>(null);

  async function stamp(qrToken: string) {
    setBusy(true);
    setError(null);
    const rm = amount.trim() === "" ? undefined : Number.parseFloat(amount);
    const res = await fetch("/api/admin/stamp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qrToken,
        amountCents:
          rm !== undefined && Number.isFinite(rm) ? Math.round(rm * 100) : undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't stamp that card. Try again.");
      return;
    }
    setResult(data as StampResult);
    setManualToken("");
    setAmount("");
    router.refresh();
  }

  const camera = useCamera(stamp);

  return (
    <div className="flex flex-col gap-4">
      {showBack && <BackLink onBack={onBack} />}
      {/* amount first - cashiers key it in while the customer opens their code */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <label className="text-sm font-medium text-text" htmlFor="amount">
          Transaction amount (RM, optional)
        </label>
        <input
          id="amount"
          inputMode="decimal"
          placeholder="12.50"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-bg px-4 text-lg tabular-nums text-text outline-none focus:border-primary"
        />
      </div>

      <CameraBox hint="Paste the customer's code below instead." camera={camera} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manualToken.trim()) void stamp(manualToken.trim());
        }}
        className="rounded-xl border border-border bg-surface p-4"
      >
        <label className="text-sm font-medium text-text" htmlFor="manual">
          Or paste the customer&apos;s code
        </label>
        <p className="mt-1 text-xs text-text-muted">
          On their card, under &quot;Code won&apos;t scan?&quot;
        </p>
        <textarea
          id="manual"
          rows={2}
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          className="mt-2 w-full rounded-xl border border-border bg-bg px-3 py-2 font-mono text-xs text-text outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !manualToken.trim()}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? "Stamping…" : "Stamp this card"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {result && (
        <div
          role="status"
          className="rounded-xl border border-leaf/50 bg-surface p-4"
          data-stamp-result
        >
          <p className="text-sm font-semibold text-text">
            Stamped for {result.customerName}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {result.rewardEarned
              ? "Reward earned. Their free item is ready to redeem."
              : `${result.stampsRemaining} more ${
                  result.stampsRemaining === 1 ? "stamp" : "stamps"
                } to their reward.`}
          </p>
          {result.pointsEarned > 0 && (
            <p className="mt-1 text-sm text-text-secondary" data-points-earned>
              +{result.pointsEarned} points · balance now{" "}
              <span className="tabular-nums">{result.pointsBalance}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- reward: lookup then confirm ----------------------------------------- */

function RewardScan({ tenantId, onBack }: { tenantId: string; onBack: () => void }) {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<CouponInfo | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmResult | null>(null);

  async function lookup(code: string) {
    setBusy(true);
    setError(null);
    setConfirmed(null);
    const res = await fetch("/api/admin/redemption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, code }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setCoupon(null);
      setError(data.error ?? "Couldn't check that coupon. Try again.");
      return;
    }
    setCoupon(data as CouponInfo);
    setManualCode("");
  }

  async function confirm() {
    if (!coupon) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/redemption/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, code: coupon.code }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't confirm that coupon. Scan it again.");
      setCoupon(null);
      return;
    }
    setCoupon(null);
    setConfirmed(data as ConfirmResult);
    router.refresh();
  }

  const camera = useCamera(lookup);

  return (
    <div className="flex flex-col gap-4">
      <BackLink onBack={onBack} />
      <CameraBox hint="Type the coupon code below instead." camera={camera} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manualCode.trim()) void lookup(manualCode.trim());
        }}
        className="rounded-xl border border-border bg-surface p-4"
      >
        <label className="text-sm font-medium text-text" htmlFor="coupon-code">
          Or type the coupon code
        </label>
        <p className="mt-1 text-xs text-text-muted">
          Under the QR on the customer&apos;s coupon, like KMB-XXXX-XXXX.
        </p>
        <input
          id="coupon-code"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="KMB-"
          autoCapitalize="characters"
          className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 font-mono text-sm uppercase text-text outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !manualCode.trim()}
          className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check this coupon"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {coupon && (
        <div className="rounded-xl border border-border bg-surface p-4" data-coupon-info>
          <p className="text-sm font-semibold text-text">{coupon.title}</p>
          <p className="mt-1 text-sm text-text-secondary">
            For {coupon.customerName} ·{" "}
            <span className="tabular-nums" data-stat>
              {coupon.pointsCost}
            </span>{" "}
            points
          </p>
          {coupon.state === "reserved" && coupon.balanceOk ? (
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={busy}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
            >
              {busy ? "Confirming…" : "Confirm and hand over"}
            </button>
          ) : (
            <p role="alert" className="mt-3 rounded-lg bg-surface-alt px-3 py-2 text-sm text-text-secondary">
              {coupon.state === "redeemed" && "This coupon was already used."}
              {coupon.state === "expired" &&
                "This coupon expired. Ask the customer to redeem again."}
              {coupon.state === "cancelled" && "The customer cancelled this coupon."}
              {coupon.state === "reserved" &&
                !coupon.balanceOk &&
                "The member doesn't have enough points anymore."}
            </p>
          )}
        </div>
      )}

      {confirmed && (
        <div
          role="status"
          className="rounded-xl border border-leaf/50 bg-surface p-4"
          data-redeem-result
        >
          <p className="text-sm font-semibold text-text">
            Redeemed. Hand {confirmed.customerName} their{" "}
            {confirmed.title.toLowerCase()}.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            −{confirmed.pointsCost} points · balance now{" "}
            <span className="tabular-nums" data-stat>
              {confirmed.newBalance}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
