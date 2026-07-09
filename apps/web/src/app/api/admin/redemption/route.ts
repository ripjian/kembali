import { NextResponse } from "next/server";

import { isRedemptionCode, normalizeRedemptionCode } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { authorizeRedeem } from "@/lib/redemption-api";

/* Coupon lookup: staff scan/type a code and see which reward and which
 * member BEFORE confirming — no points move here. */

const bodySchema = z.object({
  tenantId: z.uuid(),
  code: z.string().min(4).max(40),
});

export async function POST(req: Request) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Sign in to redeem rewards." }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Scan a coupon first." }, { status: 400 });
  }
  const code = normalizeRedemptionCode(parsed.data.code);
  if (!isRedemptionCode(code)) {
    return NextResponse.json(
      { error: "That's not a coupon code. Coupon codes look like KMB-XXXX-XXXX." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const result = await withTenant(db, parsed.data.tenantId, async (tx) => {
    const denied = await authorizeRedeem(admin, parsed.data.tenantId, tx);
    if (denied) return { error: denied };

    const [row] = await tx
      .select({
        state: schema.redemptions.state,
        pointsCost: schema.redemptions.pointsCost,
        expiresAt: schema.redemptions.expiresAt,
        title: schema.rewardItems.title,
        customerName: schema.customers.name,
        customerPhone: schema.customers.phone,
        balance: schema.customers.pointsBalance,
      })
      .from(schema.redemptions)
      .innerJoin(
        schema.rewardItems,
        eq(schema.redemptions.rewardItemId, schema.rewardItems.id),
      )
      .innerJoin(schema.customers, eq(schema.redemptions.customerId, schema.customers.id))
      .where(eq(schema.redemptions.code, code));
    if (!row) return { error: "No coupon found for this store. Scan it again." };

    const state =
      row.state === "reserved" && row.expiresAt < new Date() ? "expired" : row.state;
    return {
      code,
      state,
      title: row.title,
      customerName: row.customerName ?? row.customerPhone ?? "Customer",
      pointsCost: row.pointsCost,
      balanceOk: row.balance >= row.pointsCost,
    };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json(result);
}
