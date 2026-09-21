import Link from "next/link";

import { completeStaffOnboarding } from "@/lib/admin-actions";

/* First-access guide for store staff (Phase 1 leftover, shipped 2026-09-21).
 * Shown on the overview until the person finishes or hides it; each step
 * is checked against live data so it doubles as a setup checklist. Owners
 * and managers get the setup list, cashiers get the counter walkthrough. */

export interface OnboardingStep {
  title: string;
  detail: string;
  href?: string;
  cta?: string;
  done?: boolean;
}

export function OnboardingGuide({
  tenantId,
  storeName,
  role,
  steps,
}: {
  tenantId: string;
  storeName: string;
  role: "owner" | "manager" | "cashier";
  steps: OnboardingStep[];
}) {
  const setup = role !== "cashier";
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <section
      className="rounded-2xl border border-primary/30 bg-surface p-5 shadow-sm"
      data-onboarding={role}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text">
            {setup ? `Set up ${storeName} in five steps` : "How the counter works"}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {setup
              ? "Do these once and your loyalty program is ready for customers."
              : "Three things to know before your first customer."}
          </p>
        </div>
        {setup && (
          <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium tabular-nums text-text-secondary" data-stat>
            {doneCount}/{steps.length} done
          </span>
        )}
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="flex items-start gap-3 rounded-xl border border-border p-3"
            data-step-done={step.done ? "true" : "false"}
          >
            <span
              aria-hidden
              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                step.done ? "bg-leaf text-on-primary" : "bg-surface-alt text-text-secondary"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{step.title}</p>
              <p className="mt-0.5 text-xs text-text-muted">{step.detail}</p>
            </div>
            {step.href && !step.done && (
              <Link
                href={step.href}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
              >
                {step.cta ?? "Open"}
              </Link>
            )}
          </li>
        ))}
      </ol>

      <form action={completeStaffOnboarding} className="mt-4 flex flex-wrap items-center gap-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <button className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover">
          {setup ? "Hide this guide" : "Got it"}
        </button>
        <p className="text-xs text-text-muted">
          Every page here stays in the menu on the left.
        </p>
      </form>
    </section>
  );
}
