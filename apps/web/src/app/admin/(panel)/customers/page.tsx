import Link from "next/link";

import { schema, withTenant } from "@kembali/db";
import { desc, eq, ilike, or, sql } from "drizzle-orm";

import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = (await getAdminContext())!;
  const { q } = await searchParams;
  const db = await getDb();

  const customers = await withTenant(db, admin.tenantId, (tx) =>
    tx
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
        createdAt: schema.customers.createdAt,
        stamps: sql<number>`coalesce(max(${schema.cards.stampsCount}), 0)::int`,
      })
      .from(schema.customers)
      .leftJoin(schema.cards, eq(schema.cards.customerId, schema.customers.id))
      .where(
        q
          ? or(
              ilike(schema.customers.name, `%${q}%`),
              ilike(schema.customers.phone, `%${q}%`),
            )
          : undefined,
      )
      .groupBy(schema.customers.id)
      .orderBy(desc(schema.customers.createdAt))
      .limit(50),
  );

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Customers</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Everyone with a card at your store.
          </p>
        </div>
        <Link
          href="/admin/customers/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          Add customer
        </Link>
      </header>

      <form className="flex gap-2" action="/admin/customers">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name or phone"
          className="h-11 w-full max-w-sm rounded-xl border border-border bg-surface px-4 text-sm text-text outline-none focus:border-primary"
        />
        <button className="h-11 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-alt">
          Search
        </button>
      </form>

      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Stamps</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-text-muted">
                  {q ? "No customers match that search." : "No customers yet — add your first one."}
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="font-medium text-text hover:underline">
                    {c.name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary">{c.phone ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums text-text" data-stat>
                  {c.stamps}
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
