import Link from "next/link";
import { redirect } from "next/navigation";

import { schema, withTenant } from "@kembali/db";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getPanelContext } from "@/lib/panel";

import { CustomersTable, type CustomerRow } from "./customers-table";

/* Customers list with server-side search, sort and filter (shareable URL
 * params, like the platform merchant directory). Rows are clickable and
 * carry a View/Edit menu (customers-table.tsx). Tag filtering ships with
 * member tags (Phase 3) — not built yet, so it isn't offered here. */

const SORTS = ["joined", "name", "points", "visit"] as const;
type Sort = (typeof SORTS)[number];
const LAPSED_DAYS = 30;

interface Filters {
  q: string;
  sort: Sort;
  optin: string;
  activity: string;
}

function readFilters(sp: Record<string, string | undefined>): Filters {
  return {
    q: sp.q?.trim() ?? "",
    sort: (SORTS as readonly string[]).includes(sp.sort ?? "")
      ? (sp.sort as Sort)
      : "joined",
    optin: ["whatsapp", "email", "none"].includes(sp.optin ?? "") ? sp.optin! : "",
    activity: ["active", "lapsed"].includes(sp.activity ?? "") ? sp.activity! : "",
  };
}

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.can("manageCustomers")) redirect(ctx.base);
  const f = readFilters(await searchParams);
  const db = await getDb();

  // Raw aggregate → drizzle returns a string (not a mapped Date column).
  const lastVisit = sql<string | null>`max(${schema.stampEvents.createdAt})`;
  const lapsedCutoff = new Date(Date.now() - LAPSED_DAYS * 86_400_000);

  const rows = await withTenant(db, ctx.tenant.id, (tx) => {
    const where: SQL[] = [];
    if (f.q) {
      const m = or(
        ilike(schema.customers.name, `%${f.q}%`),
        ilike(schema.customers.phone, `%${f.q}%`),
      );
      if (m) where.push(m);
    }
    // opt-in filter reads the marketing_opt_ins jsonb column
    if (f.optin === "whatsapp") {
      where.push(sql`${schema.customers.marketingOptIns}->>'whatsapp' = 'true'`);
    } else if (f.optin === "email") {
      where.push(sql`${schema.customers.marketingOptIns}->>'email' = 'true'`);
    } else if (f.optin === "none") {
      where.push(
        sql`coalesce(${schema.customers.marketingOptIns}->>'whatsapp','false') <> 'true' and coalesce(${schema.customers.marketingOptIns}->>'email','false') <> 'true'`,
      );
    }

    // active/lapsed compares the latest visit to a cutoff (aggregate → HAVING;
    // `true` when no activity filter so the clause is always well-formed)
    const having =
      f.activity === "active"
        ? sql`max(${schema.stampEvents.createdAt}) >= ${lapsedCutoff}`
        : f.activity === "lapsed"
          ? sql`(max(${schema.stampEvents.createdAt}) is null or max(${schema.stampEvents.createdAt}) < ${lapsedCutoff})`
          : sql`true`;

    const orderBy =
      f.sort === "name"
        ? asc(schema.customers.name)
        : f.sort === "points"
          ? desc(schema.customers.pointsBalance)
          : f.sort === "visit"
            ? desc(lastVisit)
            : desc(schema.customers.createdAt);

    return tx
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
        createdAt: schema.customers.createdAt,
        points: schema.customers.pointsBalance,
        stamps: sql<number>`coalesce(max(${schema.cards.stampsCount}), 0)::int`,
        lastVisit,
      })
      .from(schema.customers)
      .leftJoin(schema.cards, eq(schema.cards.customerId, schema.customers.id))
      .leftJoin(schema.stampEvents, eq(schema.stampEvents.cardId, schema.cards.id))
      .where(where.length ? and(...where) : undefined)
      .groupBy(schema.customers.id)
      .having(having)
      .orderBy(orderBy)
      .limit(50);
  });

  const tableRows: CustomerRow[] = rows.map((c) => ({
    id: c.id,
    name: c.name ?? "—",
    phone: c.phone ?? "—",
    joined: formatDate(c.createdAt),
    lastVisit: c.lastVisit ? formatDate(new Date(c.lastVisit)) : "No visits yet",
    stamps: c.stamps,
    points: c.points,
  }));

  const selectClass =
    "h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary";

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
          href={`${ctx.base}/customers/new`}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          Add customer
        </Link>
      </header>

      <form
        className="flex flex-wrap items-center gap-2"
        action={`${ctx.base}/customers`}
      >
        <input
          type="search"
          name="q"
          defaultValue={f.q}
          placeholder="Search name or phone"
          className="h-11 w-full max-w-xs rounded-xl border border-border bg-surface px-4 text-sm text-text outline-none focus:border-primary"
        />
        <select name="sort" defaultValue={f.sort} className={selectClass} aria-label="Sort by">
          <option value="joined">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="points">Most points</option>
          <option value="visit">Recently visited</option>
        </select>
        <select name="optin" defaultValue={f.optin} className={selectClass} aria-label="Filter by marketing consent">
          <option value="">Any consent</option>
          <option value="whatsapp">WhatsApp opt-in</option>
          <option value="email">Email opt-in</option>
          <option value="none">No consent</option>
        </select>
        <select name="activity" defaultValue={f.activity} className={selectClass} aria-label="Filter by activity">
          <option value="">Everyone</option>
          <option value="active">Active (visited in {LAPSED_DAYS} days)</option>
          <option value="lapsed">Lapsed</option>
        </select>
        <button className="h-11 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-alt">
          Apply
        </button>
      </form>

      <CustomersTable
        base={ctx.base}
        rows={tableRows}
        showPoints={ctx.tenant.modules.points}
        canEdit={ctx.can("editCustomers")}
        empty={
          f.q || f.optin || f.activity
            ? "No customers match those filters."
            : "No customers yet — add your first one."
        }
      />
    </main>
  );
}
