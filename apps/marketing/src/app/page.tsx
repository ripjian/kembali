import { Button, LogoLockup, StampGrid } from "@kembali/ui";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <LogoLockup size={44} className="dark:hidden" />
      <LogoLockup size={44} mono="sand" className="hidden dark:block" />

      <div className="flex flex-col gap-4">
        <h1 className="font-display text-4xl text-text sm:text-5xl">
          Loyalty cards your customers never lose.
        </h1>
        <p className="text-balance text-lg text-text-secondary">
          The stamp card that lives in Apple Wallet &amp; Google Wallet. No app
          for your customers, no hardware for your staff, set up in 10 minutes.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <StampGrid earned={7} total={10} />
        <p className="mt-4 text-sm text-text-muted">
          3 stamps to their next reward — and they&apos;ll be back for it.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button>Start free</Button>
        <Button variant="outline">See how it works</Button>
      </div>

      <p className="text-sm text-text-muted">
        Make them <span className="font-semibold text-accent-deep">kembali</span>.
      </p>
    </main>
  );
}
