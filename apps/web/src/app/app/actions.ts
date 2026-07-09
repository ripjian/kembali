"use server";

import { redirect } from "next/navigation";

import { generateRedemptionCode, redemptionExpiry } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getCustomerSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

/* Customer-side redemption actions. Points are NOT deducted here — the
 * coupon reserves the reward; the balance moves when staff confirm the
 * scan (see /api/admin/redemption/confirm). An abandoned coupon simply
 * expires, so nothing needs refunding. */

export async function reserveRedemption(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/app/login");
  const rewardItemId = z.uuid().safeParse(formData.get("rewardItemId"));
  if (!rewardItemId.success) redirect("/app");

  const db = await getDb();
  const redemptionId = await withTenant(db, session.tenantId, async (tx) => {
    const [item] = await tx
      .select()
      .from(schema.rewardItems)
      .where(
        and(
          eq(schema.rewardItems.id, rewardItemId.data),
          eq(schema.rewardItems.active, true),
        ),
      );
    if (!item) return null;
    const [customer] = await tx
      .select({ balance: schema.customers.pointsBalance })
      .from(schema.customers)
      .where(eq(schema.customers.id, session.customerId));
    if (!customer || customer.balance < item.pointsCost) return "insufficient";

    const [row] = await tx
      .insert(schema.redemptions)
      .values({
        tenantId: session.tenantId,
        rewardItemId: item.id,
        customerId: session.customerId,
        code: generateRedemptionCode(),
        pointsCost: item.pointsCost,
        expiresAt: redemptionExpiry(),
      })
      .returning({ id: schema.redemptions.id });
    return row?.id ?? null;
  });

  if (redemptionId === "insufficient") {
    redirect(`/app/rewards/${rewardItemId.data}?error=points`);
  }
  if (!redemptionId) redirect("/app");
  redirect(`/app/coupons/${redemptionId}`);
}

export async function cancelRedemption(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/app/login");
  const redemptionId = z.uuid().safeParse(formData.get("redemptionId"));
  if (!redemptionId.success) redirect("/app");

  const db = await getDb();
  await withTenant(db, session.tenantId, (tx) =>
    tx
      .update(schema.redemptions)
      .set({ state: "cancelled" })
      .where(
        and(
          eq(schema.redemptions.id, redemptionId.data),
          eq(schema.redemptions.customerId, session.customerId),
          eq(schema.redemptions.state, "reserved"),
        ),
      ),
  );
  redirect("/app");
}
