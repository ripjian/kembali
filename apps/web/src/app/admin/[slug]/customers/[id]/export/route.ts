import { schema, withTenant } from "@kembali/db";
import { z } from "zod";

import { buildCustomerExport, exportFilename } from "@/lib/customer-export";
import { getDb } from "@/lib/db";
import { getPanelContext } from "@/lib/panel";

/* One customer's complete record as JSON (PDPA data-subject access
 * request, handled by the store). exportData permission; audit-logged. */

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.can("exportData")) return new Response("Not allowed", { status: 403 });
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });

  const db = await getDb();
  const record = await withTenant(db, ctx.tenant.id, async (tx) => {
    const data = await buildCustomerExport(tx, id);
    if (!data) return null;
    await tx.insert(schema.auditLog).values({
      tenantId: ctx.tenant.id,
      actorType: ctx.admin.kind,
      actorId: ctx.admin.subjectId,
      action: "customer.exported",
      entity: "customer",
      entityId: id,
      meta: { kind: "pdpa_single" },
    });
    return data;
  });
  if (!record) return new Response("Not found", { status: 404 });

  return new Response(JSON.stringify(record, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(`${ctx.tenant.slug}-customer`)}"`,
      "Cache-Control": "no-store",
    },
  });
}
