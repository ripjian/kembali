"use server";

import { redirect } from "next/navigation";

import { generateRedemptionCode, redemptionExpiry } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getCustomerSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

/* Customer-side redemption actions. Points are NOT deducted here - the
 * coupon reserves the reward; the balance moves when staff confirm the
 * scan (see /api/admin/redemption/confirm). An abandoned coupon simply
 * expires, so nothing needs refunding. */

/* One-screen registration after OTP verify. Full name is required; the phone
 * is already verified (not resubmitted); email and birthday are optional;
 * marketing consent is opt-in (PDPA). Session-scoped + withTenant, so a
 * customer can only complete their OWN profile under their own tenant. */
const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z
    .union([z.literal(""), z.email()])
    .transform((v) => (v === "" ? null : v.toLowerCase())),
  birthday: z
    .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
    .transform((v) => (v === "" ? null : v)),
  marketing: z.boolean(),
});

export async function completeCustomerProfile(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/app/login");

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    birthday: formData.get("birthday") ?? "",
    marketing: formData.get("marketing") === "on",
  });
  if (!parsed.success) redirect("/app/register?error=invalid");
  const p = parsed.data;

  const db = await getDb();
  await withTenant(db, session.tenantId, async (tx) => {
    await tx
      .update(schema.customers)
      .set({
        name: p.name,
        email: p.email,
        birthday: p.birthday,
        // PDPA: consent per channel; empty means no marketing.
        marketingOptIns: p.marketing ? { whatsapp: true } : {},
      })
      .where(eq(schema.customers.id, session.customerId));
    await tx.insert(schema.auditLog).values({
      tenantId: session.tenantId,
      actorType: "customer",
      actorId: session.customerId,
      action: "customer.profile_completed",
      entity: "customer",
      entityId: session.customerId,
      meta: { marketing: p.marketing, hasEmail: p.email !== null },
    });
  });

  redirect("/app");
}

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
