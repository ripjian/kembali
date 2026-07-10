import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoWordmark } from "@kembali/ui";

import { schema, withPlatform } from "@kembali/db";
import { and, asc, desc, eq, ilike, inArray, isNotNull, or, sql, type SQL } from "drizzle-orm";

import { adminLogout } from "@/lib/admin-actions";
import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { parseModules } from "@/lib/modules";
import { PLAN_LABELS, PLAN_TYPES, type PlanType } from "@/lib/plans";

import {
  CreateMerchantButton,
  EditMerchantButton,
  ManageMerchantButton,
} from "./merchant-modals";

export const dynamic = "force-dynamic";

const PER_PAGE_OPTIONS = [10, 25, 50];

interface Filters {
  q: string;
  plan: string;
  state: string;
  country: string;
  sort: "name" | "created";
  dir: "asc" | "desc";
  page: number;
  per: number;
}

function readFilters(sp: Record<string, string | undefined>): Filters {
  return {
    q: sp.q?.trim() ?? "",
    plan: sp.plan ?? "",
    state: sp.state ?? "",
    country: sp.country ?? "",
    sort: sp.sort === "name" ? "name" : "created",
    dir: sp.dir === "asc" ? "asc" : "desc",
    page: Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1),
    per: PER_PAGE_OPTIONS.includes(Number(sp.per)) ? Number(sp.per) : 25,
  };
}

function filterQuery(f: Filters, overrides: Partial<Filters>): string {
  const merged = { ...f, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.plan) params.set("plan", merged.plan);
  if (merged.state) params.set("state", merged.state);
  if (merged.country) params.set("country", merged.country);
  params.set("sort", merged.sort);
  params.set("dir", merged.dir);
  params.set("per", String(merged.per));
  params.set("page", String(merged.page));
  return `/admin/merchants?${params}`;
}

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");
  if (admin.kind !== "platform") redirect("/admin");
  const sp = await searchParams;
  const f = readFilters(sp);

  const db = await getDb();
  const data = await withPlatform(db, async (tx) => {
    const conditions: SQL[] = [];
    if (f.q) {
      const match = or(
        ilike(schema.tenants.name, `%${f.q}%`),
        ilike(schema.tenants.slug, `%${f.q}%`),
      );
      if (match) conditions.push(match);
    }
    if (f.plan) conditions.push(eq(schema.tenants.plan, f.plan));
    if (f.state) conditions.push(eq(schema.tenants.state, f.state));
    if (f.country) conditions.push(eq(schema.tenants.country, f.country));
    const where = conditions.length ? and(...conditions) : undefined;

    const orderCol = f.sort === "name" ? schema.tenants.name : schema.tenants.createdAt;
    const tenantRows = await tx
      .select({
        id: schema.tenants.id,
        name: schema.tenants.name,
        slug: schema.tenants.slug,
        plan: schema.tenants.plan,
        logoUrl: schema.tenants.logoUrl,
        modules: schema.tenants.modules,
        brandPrimary: schema.tenants.brandPrimary,
        brandAccent: schema.tenants.brandAccent,
        createdAt: schema.tenants.createdAt,
      })
      .from(schema.tenants)
      .where(where)
      .orderBy(f.dir === "asc" ? asc(orderCol) : desc(orderCol))
      .limit(f.per)
      .offset((f.page - 1) * f.per);
    const [total] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.tenants)
      .where(where);

    // Location comes from each tenant's first outlet (address moved to
    // outlets, Decision Log 2026-07-11). One query, mapped in JS.
    const tenantIds = tenantRows.map((t) => t.id);
    const outletRows = tenantIds.length
      ? await tx
          .select({
            tenantId: schema.outlets.tenantId,
            city: schema.outlets.city,
            state: schema.outlets.state,
          })
          .from(schema.outlets)
          .where(inArray(schema.outlets.tenantId, tenantIds))
          .orderBy(asc(schema.outlets.createdAt))
      : [];
    const locByTenant = new Map<string, string>();
    for (const o of outletRows) {
      if (!locByTenant.has(o.tenantId)) {
        locByTenant.set(o.tenantId, [o.city, o.state].filter(Boolean).join(", "));
      }
    }
    const rows = tenantRows.map((t) => ({
      ...t,
      location: locByTenant.get(t.id) || "",
    }));

    const states = await tx
      .selectDistinct({ v: schema.tenants.state })
      .from(schema.tenants)
      .where(isNotNull(schema.tenants.state));
    const countries = await tx
      .selectDistinct({ v: schema.tenants.country })
      .from(schema.tenants);

    return {
      rows,
      total: total?.n ?? 0,
      states: states.map((s) => s.v).filter((v): v is string => Boolean(v)),
      countries: countries.map((c) => c.v),
    };
  });

  const pages = Math.max(1, Math.ceil(data.total / f.per));
  const selectClass =
    "h-10 rounded-lg border border-border bg-surface px-2 text-xs text-text";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <LogoWordmark size={22} className="dark:hidden" />
          <LogoWordmark size={22} mono="sand" className="hidden dark:block" />
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-primary">
            System admin
          </span>
        </div>
        <form action={adminLogout}>
          <button className="text-xs font-medium text-text-muted hover:text-text">
            Sign out
          </button>
        </form>
      </header>

      <main className="mt-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-text">Merchants</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {data.total} {data.total === 1 ? "store" : "stores"} on the
              platform.
            </p>
          </div>
          <CreateMerchantButton />
        </div>

        {sp.created && (
          <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
            Merchant created. Their owner can sign in with the email and
            password you set.
          </p>
        )}
        {sp.saved && (
          <p role="status" className="rounded-xl border border-leaf/50 bg-surface px-4 py-3 text-sm text-text">
            Merchant details saved.
          </p>
        )}
        {sp.error && (
          <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
            {sp.error === "exists"
              ? "A merchant with that name already exists. Pick a different name."
              : "Check the form. Name, outlet, program, owner email and an 8+ character password are required."}
          </p>
        )}

        {/* search / filter / sort toolbar */}
        <form action="/admin/merchants" className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={f.q}
            placeholder="Search name"
            className="h-10 w-48 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
          />
          <select name="plan" defaultValue={f.plan} className={selectClass} aria-label="Filter by plan">
            <option value="">All plans</option>
            {PLAN_TYPES.map((p) => (
              <option key={p} value={p}>
                {PLAN_LABELS[p]}
              </option>
            ))}
          </select>
          <select name="state" defaultValue={f.state} className={selectClass} aria-label="Filter by state">
            <option value="">All states</option>
            {data.states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="country" defaultValue={f.country} className={selectClass} aria-label="Filter by country">
            <option value="">All countries</option>
            {data.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={f.sort} className={selectClass} aria-label="Sort by">
            <option value="created">Newest first</option>
            <option value="name">Name A–Z</option>
          </select>
          <select name="per" defaultValue={String(f.per)} className={selectClass} aria-label="Per page">
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <input type="hidden" name="dir" value={f.sort === "name" ? "asc" : "desc"} />
          <button className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-alt">
            Apply
          </button>
        </form>

        <section className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted">
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-text-muted">
                    No merchants match those filters.
                  </td>
                </tr>
              )}
              {data.rows.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt="" className="size-8 rounded-lg border border-border object-cover" />
                      ) : (
                        <span className="flex size-8 items-center justify-center rounded-lg bg-surface-alt text-xs font-semibold text-text-secondary">
                          {t.name.slice(0, 1)}
                        </span>
                      )}
                      <div>
                        <p className="font-medium text-text">{t.name}</p>
                        <p className="font-mono text-xs text-text-muted">/admin/{t.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {PLAN_LABELS[(t.plan as PlanType)] ?? t.plan}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {t.location || "-"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <EditMerchantButton
                        tenant={{
                          id: t.id,
                          name: t.name,
                          plan: t.plan,
                          logoUrl: t.logoUrl,
                          modules: parseModules(t.modules),
                          brandPrimary: t.brandPrimary,
                          brandAccent: t.brandAccent,
                        }}
                      />
                      <ManageMerchantButton name={t.name} slug={t.slug} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* pagination */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            Page {f.page} of {pages}
          </span>
          <div className="flex gap-2">
            {f.page > 1 && (
              <Link
                href={filterQuery(f, { page: f.page - 1 })}
                className="rounded-lg border border-border px-3 py-1.5 font-medium text-text hover:bg-surface-alt"
              >
                ← Previous
              </Link>
            )}
            {f.page < pages && (
              <Link
                href={filterQuery(f, { page: f.page + 1 })}
                className="rounded-lg border border-border px-3 py-1.5 font-medium text-text hover:bg-surface-alt"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
