import { schema, withTenant } from "@kembali/db";

import { getCustomerSession } from "@/lib/auth";
import { buildCustomerExport, exportFilename } from "@/lib/customer-export";
import { getDb } from "@/lib/db";

/* "Download my data": the signed-in customer's own record (PDPA). Same
 * shape as the store-side export, scoped by the session, audit-logged. */

export async function GET() {
  const session = await getCustomerSession({ allowRotation: true });
  if (!session) return new Response("Sign in to download your data.", { status: 401 });

  const db = await getDb();
  const record = await withTenant(db, session.tenantId, async (tx) => {
    const data = await buildCustomerExport(tx, session.customerId);
    if (!data) return null;
    await tx.insert(schema.auditLog).values({
      tenantId: session.tenantId,
      actorType: "customer",
      actorId: session.customerId,
      action: "customer.self_exported",
      entity: "customer",
      entityId: session.customerId,
      meta: {},
    });
    return data;
  });
  if (!record) return new Response("Not found", { status: 404 });

  return new Response(JSON.stringify(record, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename("my-kembali-data")}"`,
      "Cache-Control": "no-store",
    },
  });
}
