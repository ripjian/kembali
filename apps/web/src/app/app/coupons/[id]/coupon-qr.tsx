"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

/* Static QR of the single-use coupon code (unlike the stamp QR it doesn't
 * rotate - the DB makes it single-use). While the coupon is reserved we
 * poll so the screen flips to "redeemed" the moment staff confirm. */

export function CouponQr({ code, live }: { code: string; live: boolean }) {
  const router = useRouter();
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(code, { margin: 1, width: 480 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [live, router]);

  return (
    <div className="flex flex-col items-center gap-3">
      {dataUrl ? (
        // local data URL, nothing to optimize
        <img
          src={dataUrl}
          alt="Your coupon code, show this at the counter"
          className="size-52 rounded-2xl border border-border bg-white p-2"
        />
      ) : (
        <div className="size-52 animate-pulse rounded-2xl border border-border bg-surface-alt" />
      )}
      <p
        className="rounded-xl bg-surface-alt px-4 py-2 font-mono text-sm tracking-wider text-text"
        data-coupon-code
      >
        {code}
      </p>
    </div>
  );
}
