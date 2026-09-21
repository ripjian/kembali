import "server-only";

import { schema } from "@kembali/db";
import { asc, eq, or } from "drizzle-orm";

/* PDPA data export (DEVSPEC §14). One customer's complete record, shaped
 * for a human and a machine: profile, consents, card, every ledger row
 * that mentions them, coupons and invites. Free on every plan, never
 * gated. Runs inside a tenant-scoped transaction. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural drizzle tx
type Tx = any;

export async function buildCustomerExport(tx: Tx, customerId: string) {
  const [customer] = await tx
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId));
  if (!customer) return null;
  const [card] = await tx
    .select()
    .from(schema.cards)
    .where(eq(schema.cards.customerId, customerId));
  const visits = card
    ? await tx
        .select({
          at: schema.stampEvents.createdAt,
          amountCents: schema.stampEvents.amountCents,
          source: schema.stampEvents.source,
          outlet: schema.outlets.name,
        })
        .from(schema.stampEvents)
        .leftJoin(schema.outlets, eq(schema.stampEvents.outletId, schema.outlets.id))
        .where(eq(schema.stampEvents.cardId, card.id))
        .orderBy(asc(schema.stampEvents.createdAt))
    : [];
  const points = await tx
    .select({
      at: schema.pointEvents.createdAt,
      delta: schema.pointEvents.delta,
      source: schema.pointEvents.source,
      reason: schema.pointEvents.reason,
      outlet: schema.outlets.name,
    })
    .from(schema.pointEvents)
    .leftJoin(schema.outlets, eq(schema.pointEvents.outletId, schema.outlets.id))
    .where(eq(schema.pointEvents.customerId, customerId))
    .orderBy(asc(schema.pointEvents.createdAt));
  const coupons = await tx
    .select({
      at: schema.redemptions.createdAt,
      reward: schema.rewardItems.title,
      pointsCost: schema.redemptions.pointsCost,
      state: schema.redemptions.state,
      redeemedAt: schema.redemptions.redeemedAt,
      grantSource: schema.redemptions.grantSource,
    })
    .from(schema.redemptions)
    .innerJoin(schema.rewardItems, eq(schema.redemptions.rewardItemId, schema.rewardItems.id))
    .where(eq(schema.redemptions.customerId, customerId))
    .orderBy(asc(schema.redemptions.createdAt));
  const referrals = await tx
    .select({
      at: schema.referrals.createdAt,
      role: schema.referrals.referrerCustomerId,
      state: schema.referrals.state,
      qualifiedAt: schema.referrals.qualifiedAt,
    })
    .from(schema.referrals)
    .where(
      or(
        eq(schema.referrals.referrerCustomerId, customerId),
        eq(schema.referrals.refereeCustomerId, customerId),
      ),
    )
    .orderBy(asc(schema.referrals.createdAt));

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      birthday: customer.birthday,
      language: customer.language,
      joinedAt: customer.createdAt,
      marketingConsent: customer.marketingOptIns,
      referralCode: customer.referralCode,
    },
    card: card
      ? { program: card.programId, stamps: card.stampsCount, status: card.status, since: card.createdAt }
      : null,
    pointsBalance: customer.pointsBalance,
    visits,
    pointsHistory: points,
    coupons,
    referrals: referrals.map((r: { role: string; at: Date; state: string; qualifiedAt: Date | null }) => ({
      at: r.at,
      role: r.role === customerId ? "invited a friend" : "was invited",
      state: r.state,
      qualifiedAt: r.qualifiedAt,
    })),
  };
}

export function exportFilename(base: string): string {
  return `${base}-${new Date().toISOString().slice(0, 10)}.json`;
}
