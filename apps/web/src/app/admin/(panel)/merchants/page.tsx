import { redirect } from "next/navigation";

import { schema, withPlatform } from "@kembali/db";
import { desc } from "drizzle-orm";

import { createTenant, switchTenant } from "@/lib/admin-actions";
import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text outline-none focus:border-primary";

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const admin = (await getAdminContext())!;
  if (admin.kind !== "platform") redirect("/admin");
  const { error, created } = await searchParams;

  const db = await getDb();
  const tenants = await withPlatform(db, (tx) =>
    tx.select().from(schema.tenants).orderBy(desc(schema.tenants.createdAt)),
  );

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Merchants</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Every store on the platform. Manage one to see their panel exactly
          as they do.
        </p>
      </header>

      {created && (
        <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
          Merchant created. Their owner can sign in with the email and
          password you set.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          {error === "exists"
            ? "A merchant with that name already exists."
            : "Check the form — every field except none is required, and passwords need 8+ characters."}
        </p>
      )}

      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Store</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-text">{t.name}</p>
                  <p className="font-mono text-xs text-text-muted">{t.slug}</p>
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-3 text-text-secondary">{t.plan}</td>
                <td className="px-4 py-3 text-right">
                  <form action={switchTenant}>
                    <input type="hidden" name="tenantId" value={t.id} />
                    <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt">
                      Manage this store
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="max-w-lg rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-text">Add a merchant</h2>
        <p className="mt-1 text-xs text-text-muted">
          Creates the store, its first outlet, a default loyalty program and
          the owner&apos;s login.
        </p>
        <form action={createTenant} className="mt-4 flex flex-col gap-3">
          <input name="name" required placeholder="Store name" className={inputClass} />
          <input name="outletName" required placeholder="First outlet (e.g. SS15 branch)" className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="stampsRequired"
              type="number"
              min={2}
              max={30}
              defaultValue={10}
              required
              aria-label="Stamps required for a reward"
              className={inputClass}
            />
            <input name="rewardTitle" required placeholder="Reward (e.g. Free drink)" className={inputClass} />
          </div>
          <hr className="border-border" />
          <input name="ownerName" required placeholder="Owner's name" className={inputClass} />
          <input name="ownerEmail" type="email" required placeholder="Owner's email (their login)" className={inputClass} />
          <input
            name="ownerPassword"
            type="password"
            required
            minLength={8}
            placeholder="Owner's password (8+ characters)"
            className={inputClass}
          />
          <button className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover">
            Create merchant
          </button>
        </form>
      </section>
    </main>
  );
}
