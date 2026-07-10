"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@kembali/ui";

/* Customer sign-in: phone → 6-digit code. First sign-in creates the card
 * (login doubles as registration). Dev builds accept the bypass code. */

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devBypass, setDevBypass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't send the code. Try again.");
      return;
    }
    setDevBypass(Boolean(data.devBypass));
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "That code didn't match. Try again.");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <LogoMark size={40} className="dark:hidden" />
        <LogoMark size={40} mono="sand" className="hidden dark:block" />
        <div>
          <h1 className="text-xl font-semibold text-text">Your loyalty card</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {step === "phone"
              ? "Enter your phone number to open your card, or create one."
              : "We sent a 6-digit code to your phone."}
          </p>
        </div>
      </header>

      {step === "phone" ? (
        <form onSubmit={requestCode} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-text" htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="012-345 6701"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-text outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-1 inline-flex h-12 items-center justify-center rounded-xl bg-tenant-primary text-sm font-semibold text-tenant-on-primary hover:bg-tenant-primary-hover disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-text" htmlFor="code">
            6-digit code
          </label>
          <input
            id="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="h-12 rounded-xl border border-border bg-surface px-4 text-center text-xl tracking-[0.4em] text-text outline-none focus:border-primary"
          />
          {devBypass && (
            <p className="text-xs text-text-muted">
              Development build: the code is in the server log, or use 888888.
            </p>
          )}
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="mt-1 inline-flex h-12 items-center justify-center rounded-xl bg-tenant-primary text-sm font-semibold text-tenant-on-primary hover:bg-tenant-primary-hover disabled:opacity-60"
          >
            {busy ? "Checking…" : "Open my card"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
            className="text-xs font-medium text-text-muted hover:text-text"
          >
            Use a different number
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
    </main>
  );
}
