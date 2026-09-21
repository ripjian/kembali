import { schema, withTenant } from "@kembali/db";
import { asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { getPanelContext } from "@/lib/panel";
import { toCsv } from "@/lib/report-data";

/* PDPA export: EVERY customer this store holds data about, as CSV. Free on
 * every plan (PRICING.md hard rule #1), gated only by the exportData
 * permission, and recorded in the audit log because it moves personal data
 * out of the system. */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.can("exportData")) {
    return new Response("Not allowed", { status: 403 });
  }

  const db = await getDb();
  const rows = await withTenant(db, ctx.tenant.id, async (tx) => {
    const data = await tx
      .select({
        name: schema.customers.name,
        phone: schema.customers.phone,
        email: schema.customers.email,
        birthday: schema.customers.birthday,
        language: schema.customers.language,
        joined: schema.customers.createdAt,
        consent: schema.customers.marketingOptIns,
        points: schema.customers.pointsBalance,
        referralCode: schema.customers.referralCode,
        stamps: sql<number>`coalesce(max(${schema.cards.stampsCount}), 0)::int`,
        visits: sql<number>`count(${schema.stampEvents.id})::int`,
        spendCents: sql<number>`coalesce(sum(${schema.stampEvents.amountCents}), 0)::int`,
        lastVisit: sql<Date | null>`max(${schema.stampEvents.createdAt})`,
      })
      .from(schema.customers)
      .leftJoin(schema.cards, eq(schema.cards.customerId, schema.customers.id))
      .leftJoin(schema.stampEvents, eq(schema.stampEvents.cardId, schema.cards.id))
      .groupBy(schema.customers.id)
      .orderBy(asc(schema.customers.createdAt));
    await tx.insert(schema.auditLog).values({
      tenantId: ctx.tenant.id,
      actorType: ctx.admin.kind,
      actorId: ctx.admin.subjectId,
      action: "customers.exported",
      entity: "tenant",
      entityId: ctx.tenant.id,
      meta: { count: data.length, kind: "pdpa_all_customers" },
    });
    return data;
  });

  const consent = (raw: unknown): string => {
    const c = (raw ?? {}) as Record<string, unknown>;
    return Object.keys(c)
      .filter((k) => c[k] === true)
      .join("+") || "none";
  };
  const csv = toCsv(
    [
      "Name", "Phone", "Email", "Birthday", "Language", "Joined", "Marketing consent",
      "Points balance", "Stamps on card", "Visits", "Spend (RM)", "Last visit", "Invite code",
    ],
    rows.map((r) => [
      r.name ?? "",
      r.phone ?? "",
      r.email ?? "",
      r.birthday ?? "",
      r.language,
      r.joined.toISOString(),
      consent(r.consent),
      r.points,
      r.stamps,
      r.visits,
      (r.spendCents / 100).toFixed(2),
      r.lastVisit ? new Date(r.lastVisit).toISOString() : "",
      r.referralCode ?? "",
    ]),
  );
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ctx.tenant.slug}-customers-pdpa-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
