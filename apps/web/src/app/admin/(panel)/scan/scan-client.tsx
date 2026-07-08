"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* Scan & stamp: camera scanning via the native BarcodeDetector where the
 * browser supports it, with a paste-the-code fallback that works
 * everywhere. Amount is optional — it feeds the sales numbers in reports. */

interface StampResult {
  customerName: string;
  stampsCount: number;
  stampsRequired: number;
  stampsRemaining: number;
  rewardEarned: boolean;
}

type BarcodeDetectorLike = {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
};

export function ScanClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraState, setCameraState] = useState<"idle" | "on" | "unsupported" | "denied">("idle");
  const [manualToken, setManualToken] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StampResult | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const busyRef = useRef(false);

  async function stamp(qrToken: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    const rm = amount.trim() === "" ? undefined : Number.parseFloat(amount);
    const res = await fetch("/api/admin/stamp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qrToken,
        amountCents:
          rm !== undefined && Number.isFinite(rm)
            ? Math.round(rm * 100)
            : undefined,
      }),
    });
    const data = await res.json();
    busyRef.current = false;
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

  async function startCamera() {
    setError(null);
    const Detector = (
      globalThis as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }
    ).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
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
      setCameraState("on");
      const detector = new Detector({ formats: ["qr_code"] });
      let raf = 0;
      const tick = async () => {
        if (!busyRef.current && video.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue;
            if (value) await stamp(value);
          } catch {
            /* detection errors are transient — keep scanning */
          }
        }
        raf = requestAnimationFrame(() => void tick());
      };
      raf = requestAnimationFrame(() => void tick());
      stopRef.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        setCameraState("idle");
      };
    } catch {
      setCameraState("denied");
    }
  }

  useEffect(() => () => stopRef.current(), []);

  return (
    <div className="flex flex-col gap-4">
      {/* amount first — cashiers key it in while the customer opens their code */}
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

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-text">Camera scan</p>
          {cameraState !== "on" ? (
            <button
              type="button"
              onClick={() => void startCamera()}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover"
            >
              Start camera
            </button>
          ) : (
            <button
              type="button"
              onClick={() => stopRef.current()}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface-alt"
            >
              Stop
            </button>
          )}
        </div>
        <video
          ref={videoRef}
          muted
          playsInline
          className={`mt-3 aspect-video w-full rounded-xl bg-surface-alt object-cover ${
            cameraState === "on" ? "" : "hidden"
          }`}
        />
        {cameraState === "unsupported" && (
          <p className="mt-2 text-xs text-text-muted">
            This browser can&apos;t scan directly. Paste the customer&apos;s
            code below instead.
          </p>
        )}
        {cameraState === "denied" && (
          <p className="mt-2 text-xs text-text-muted">
            Camera access was blocked. Allow it in the browser settings, or
            paste the code below.
          </p>
        )}
      </div>

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
            Stamped — {result.customerName}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {result.rewardEarned
              ? "Reward earned! Their free item is ready to redeem."
              : `${result.stampsRemaining} more ${
                  result.stampsRemaining === 1 ? "stamp" : "stamps"
                } to their reward.`}
          </p>
        </div>
      )}
    </div>
  );
}
