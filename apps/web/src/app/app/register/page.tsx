import { redirect } from "next/navigation";

import { needsRegistration } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { eq } from "drizzle-orm";
import { LogoMark } from "@kembali/ui";

import { getCustomerSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

import { completeCustomerProfile } from "../actions";

export const dynamic = "force-dynamic";

/* One-screen registration after OTP verify. Reached only when the verified
 * phone has no name yet; returning customers are sent straight to their card.
 * Themed by the tenant (the /app layout wraps this in TenantTheme). */

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getCustomerSession();
  if (!session) redirect("/app/login");
  const { error } = await searchParams;

  const db = await getDb();
  const customer = await withTenant(db, session.tenantId, async (tx) => {
    const [c] = await tx
      .select({
        name: schema.customers.name,
        phone: schema.customers.phone,
        tenantName: schema.tenants.name,
      })
      .from(schema.customers)
      .innerJoin(schema.tenants, eq(schema.tenants.id, schema.customers.tenantId))
      .where(eq(schema.customers.id, session.customerId));
    return c ?? null;
  });
  if (!customer) redirect("/app/login");
  // Returning customers who already registered skip straight to their card.
  if (!needsRegistration(customer)) redirect("/app");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <LogoMark size={40} className="dark:hidden" />
        <LogoMark size={40} mono="sand" className="hidden dark:block" />
        <div>
          <h1 className="text-xl font-semibold text-text">
            Welcome to {customer.tenantName}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Tell us your name so we can set up your card.
          </p>
        </div>
      </header>

      {error === "invalid" && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          Check your details. A name is required, and any email must be valid.
        </p>
      )}

      <form action={completeCustomerProfile} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Full name
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="Aisyah binti Yusof"
            className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-text outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Phone number
          <input
            value={customer.phone ?? ""}
            readOnly
            aria-readonly="true"
            className="h-12 cursor-not-allowed rounded-xl border border-border bg-surface-alt px-4 text-base text-text-secondary outline-none"
          />
          <span className="text-xs font-normal text-text-muted">
            Verified just now.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Email <span className="font-normal text-text-muted">(optional)</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-text outline-none focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Birthday <span className="font-normal text-text-muted">(optional)</span>
          <input
            name="birthday"
            type="date"
            className="h-12 rounded-xl border border-border bg-surface px-4 text-base text-text outline-none focus:border-primary"
          />
          <span className="text-xs font-normal text-text-muted">
            We&apos;ll send a birthday treat later.
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-sm text-text-secondary">
          <input
            name="marketing"
            type="checkbox"
            className="mt-0.5 size-4 accent-[var(--tenant-primary)]"
          />
          <span>
            Send me offers and reminders on WhatsApp. You can opt out anytime.
          </span>
        </label>

        <button
          type="submit"
          className="mt-1 inline-flex h-12 items-center justify-center rounded-xl bg-tenant-primary text-sm font-semibold text-tenant-on-primary hover:bg-tenant-primary-hover"
        >
          Save and open my card
        </button>
      </form>
    </main>
  );
}
