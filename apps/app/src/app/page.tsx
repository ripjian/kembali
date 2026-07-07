import { computeCardProgress } from "@kembali/core";
import { Button, LogoMark, StampGrid } from "@kembali/ui";

// Placeholder card matching the demo seed (Kopi Card: 4/9 stamps).
// Phase 1 replaces this with the real OTP-authenticated /card screen.
const DEMO = { stampsCount: 4, stampsRequired: 9 };

export default function CardPage() {
  const progress = computeCardProgress(DEMO);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-5 py-10">
      <header className="flex w-full items-center gap-3">
        <LogoMark size={36} className="dark:hidden" />
        <LogoMark size={36} mono="sand" className="hidden dark:block" />
        <div>
          <h1 className="text-lg font-semibold text-text">Kopi Kembali</h1>
          <p className="text-sm text-text-secondary">Kopi Card</p>
        </div>
      </header>

      <section className="w-full rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <StampGrid earned={progress.stampsTowardNext} total={DEMO.stampsRequired} />

        {/* Leaf = progress fill; coral is reserved for earned stamps */}
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
          <div
            className="h-full rounded-full bg-leaf"
            style={{ width: `${progress.progress * 100}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          <span className="font-semibold tabular-nums text-text" data-stat>
            {progress.stampsRemaining}
          </span>{" "}
          more stamps to your free kopi
        </p>
      </section>

      <Button className="w-full">Show my QR to stamp</Button>
      <p className="text-center text-xs text-text-muted">
        Your card always works right here in your browser — nothing to
        download.
      </p>
    </main>
  );
}
