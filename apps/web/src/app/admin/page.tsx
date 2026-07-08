import { redirect } from "next/navigation";

import { schema, withTenant } from "@kembali/db";

import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** /admin routes by identity: platform admins to the merchants directory,
 * staff to their own store's panel (/admin/[slug]). */
export default async function AdminRootPage() {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");
  if (admin.kind === "platform") redirect("/admin/merchants");

  const db = await getDb();
  const slug = await withTenant(db, admin.tenantId!, async (tx) => {
    const [row] = await tx
      .select({ slug: schema.tenants.slug })
      .from(schema.tenants);
    return row?.slug ?? null;
  });
  if (!slug) redirect("/admin/login");
  redirect(`/admin/${slug}`);
}
