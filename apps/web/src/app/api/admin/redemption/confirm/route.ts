import { NextResponse } from "next/server";

import { isRedemptionCode, normalizeRedemptionCode } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";

import { getAdminContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { authorizeRedeem } from "@/lib/redemption-api";

/* Confirm a coupon at the counter. Single-use is enforced by the atomic
 * state-guarded UPDATE (proven under concurrency in packages/db tests);
 * the points leave the member's balance here, in the same transaction. */

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
  const tenantId = parsed.data.tenantId;

  const db = await getDb();
  const result = await withTenant(db, tenantId, async (tx) => {
    const denied = await authorizeRedeem(admin, tenantId, tx);
    if (denied) return { error: denied };

    const [coupon] = await tx
      .select()
      .from(schema.redemptions)
      .where(eq(schema.redemptions.code, code));
    if (!coupon) return { error: "No coupon found for this store. Scan it again." };
    if (coupon.state === "redeemed") {
      return { error: "This coupon was already used." };
    }
    if (coupon.state === "cancelled") {
      return { error: "The customer cancelled this coupon." };
    }
    if (coupon.expiresAt < new Date()) {
      await tx
        .update(schema.redemptions)
        .set({ state: "expired" })
        .where(and(eq(schema.redemptions.id, coupon.id), eq(schema.redemptions.state, "reserved")));
      return { error: "This coupon expired. Ask the customer to redeem again." };
    }

    // Lock the member's row so two coupons can't both pass the balance
    // check, then re-check against the projection.
    const [customer] = await tx
      .select({
        id: schema.customers.id,
        name: schema.customers.name,
        phone: schema.customers.phone,
        balance: schema.customers.pointsBalance,
      })
      .from(schema.customers)
      .where(eq(schema.customers.id, coupon.customerId))
      .for("update");
    if (!customer) return { error: "No coupon found for this store. Scan it again." };
    if (customer.balance < coupon.pointsCost) {
      return { error: "The member doesn't have enough points anymore." };
    }

    // Atomic single-use flip: only one concurrent confirm matches this row.
    const [won] = await tx
      .update(schema.redemptions)
      .set({
        state: "redeemed",
        redeemedAt: new Date(),
        redeemedByStaffId: admin.kind === "staff" ? admin.subjectId : null,
      })
      .where(
        and(
          eq(schema.redemptions.id, coupon.id),
          eq(schema.redemptions.state, "reserved"),
          gt(schema.redemptions.expiresAt, new Date()),
        ),
      )
      .returning({ id: schema.redemptions.id });
    if (!won) return { error: "This coupon was already used." };

    await tx.insert(schema.pointEvents).values({
      tenantId,
      customerId: customer.id,
      delta: -coupon.pointsCost,
      source: "redemption",
      staffId: admin.kind === "staff" ? admin.subjectId : null,
      redemptionId: coupon.id,
    });
    await tx.insert(schema.auditLog).values({
      tenantId,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "redemption.confirmed",
      entity: "redemption",
      entityId: coupon.id,
      meta: { pointsCost: coupon.pointsCost, customerId: customer.id },
    });

    const [after] = await tx
      .select({ balance: schema.customers.pointsBalance })
      .from(schema.customers)
      .where(eq(schema.customers.id, customer.id));
    const [item] = await tx
      .select({ title: schema.rewardItems.title })
      .from(schema.rewardItems)
      .where(eq(schema.rewardItems.id, coupon.rewardItemId));
    return {
      title: item?.title ?? "Reward",
      customerName: customer.name ?? customer.phone ?? "Customer",
      pointsCost: coupon.pointsCost,
      newBalance: after?.balance ?? 0,
    };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json(result);
}
