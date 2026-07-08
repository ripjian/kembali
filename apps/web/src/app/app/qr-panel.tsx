"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

/* The customer's rotating stamp code: refetched before each expiry so a
 * screenshot goes stale in ~90 seconds (SECURITY.md rule 5). */

export function QrPanel() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/app/qr-token");
      if (!res.ok) throw new Error();
      const data: { token: string; ttlSeconds: number } = await res.json();
      setToken(data.token);
      setDataUrl(
        await QRCode.toDataURL(data.token, { margin: 1, width: 480 }),
      );
      setError(null);
      return data.ttlSeconds;
    } catch {
      setError("Couldn't refresh your code. Pull to retry.");
      return 30;
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const loop = async () => {
      const ttl = await refresh();
      if (!cancelled) timer = setTimeout(loop, Math.max(15, ttl - 20) * 1000);
    };
    void loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [refresh]);

  return (
    <div className="flex flex-col items-center gap-2">
      {dataUrl ? (
        // plain <img>: the QR is a local data URL, nothing to optimize
        <img
          src={dataUrl}
          alt="Your stamp code — show this at the counter"
          className="size-52 rounded-2xl border border-border bg-white p-2"
        />
      ) : (
        <div className="size-52 animate-pulse rounded-2xl border border-border bg-surface-alt" />
      )}
      <p className="text-xs text-text-muted">
        {error ?? "Refreshes automatically — screenshots won't work."}
      </p>
      {token && (
        <details className="w-full text-center">
          <summary className="cursor-pointer text-xs text-text-muted">
            Code won&apos;t scan?
          </summary>
          <p className="mt-2 break-all rounded-xl bg-surface-alt p-3 font-mono text-[10px] text-text-secondary" data-qr-token>
            {token}
          </p>
        </details>
      )}
    </div>
  );
}
