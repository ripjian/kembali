import "server-only";

import {
  evaluateReferral,
  generateRedemptionCode,
  generateReferralCode,
  parseReferralSettings,
  planAllowsReferrals,
  referralVoucherExpiry,
  referralWindowStart,
  type ReferralReward,
  type ReferralSettings,
} from "@kembali/core";
import { isUniqueViolation, schema } from "@kembali/db";
import { and, eq, gte, inArray, sql } from "drizzle-orm";

import { parseModules } from "./modules";

/* Referral program plumbing (Phase 5, DEVSPEC §17). Every function runs
 * inside a tenant-scoped transaction the caller already opened, so RLS
 * keeps codes, referrals and rewards inside one store. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- structural drizzle tx
type Tx = any;

export interface ReferralProgram {
  /** Module on, plan allows it, and the merchant switched it on. */
  live: boolean;
  settings: ReferralSettings;
  plan: string;
  moduleOn: boolean;
}

/** Read the store's program state from its tenant row. */
export async function readReferralProgram(tx: Tx): Promise<ReferralProgram> {
  const [t] = await tx
    .select({
      plan: schema.tenants.plan,
      modules: schema.tenants.modules,
      referralSettings: schema.tenants.referralSettings,
    })
    .from(schema.tenants);
  const settings = parseReferralSettings(t?.referralSettings);
  const moduleOn = parseModules(t?.modules).referrals;
  const plan = t?.plan ?? "trial";
  return {
    live: moduleOn && planAllowsReferrals(plan) && settings.enabled,
    settings,
    plan,
    moduleOn,
  };
}

/** The customer's personal invite code, minted on first use. A clash on
 * the per-store unique index is retried with a fresh code. */
export async function ensureReferralCode(tx: Tx, customerId: string): Promise<string> {
  const [row] = await tx
    .select({ code: schema.customers.referralCode })
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId));
  if (row?.code) return row.code as string;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      await tx
        .update(schema.customers)
        .set({ referralCode: code })
        .where(eq(schema.customers.id, customerId));
      return code;
    } catch (err) {
      if (!isUniqueViolation(err, "customers_tenant_referral_code_uq")) throw err;
    }
  }
  throw new Error("Could not mint a referral code");
}

/** Who owns an invite code in this store, or null. */
export async function findReferrerByCode(
  tx: Tx,
  code: string,
): Promise<{ id: string; name: string | null } | null> {
  const [row] = await tx
    .select({ id: schema.customers.id, name: schema.customers.name })
    .from(schema.customers)
    .where(eq(schema.customers.referralCode, code));
  return row ?? null;
}

/** Record that a brand-new customer arrived through `code`. Writes a
 * pending row (rewards come at the friend's first stamp) or a rejected row
 * when the cap or a rule says no, so the merchant's report explains it. */
export async function recordReferralAtSignup(
  tx: Tx,
  input: { tenantId: string; code: string; refereeCustomerId: string },
): Promise<"pending" | "rejected" | "ignored"> {
  const program = await readReferralProgram(tx);
  if (!program.live) return "ignored";
  const referrer = await findReferrerByCode(tx, input.code);
  if (!referrer) return "ignored";

  const [recent] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.referrals)
    .where(
      and(
        eq(schema.referrals.referrerCustomerId, referrer.id),
        inArray(schema.referrals.state, ["pending", "rewarded"]),
        gte(schema.referrals.createdAt, referralWindowStart(program.settings)),
      ),
    );
  const verdict = evaluateReferral({
    settings: program.settings,
    referrerId: referrer.id,
    refereeId: input.refereeCustomerId,
    recentCount: recent?.n ?? 0,
  });
  if (!verdict.ok && verdict.reason === "self") return "ignored";

  await tx.insert(schema.referrals).values({
    tenantId: input.tenantId,
    referrerCustomerId: referrer.id,
    refereeCustomerId: input.refereeCustomerId,
    state: verdict.ok ? "pending" : "rejected",
    note: verdict.ok ? null : verdict.reason,
  });
  return verdict.ok ? "pending" : "rejected";
}

export interface GrantedReferral {
  referrerName: string;
  refereeName: string;
  referrerReward: string;
  refereeReward: string;
}

/** Plain words for a reward, for the customer card and the cashier. */
export function describeReward(
  reward: ReferralReward,
  itemTitles: Map<string, string>,
): string {
  if (reward.type === "points") return `${reward.points} points`;
  if (reward.type === "voucher") {
    return `a free ${itemTitles.get(reward.rewardItemId) ?? "reward"}`;
  }
  return "nothing";
}

/** Titles of the catalog items a settings object refers to. */
export async function rewardTitlesFor(
  tx: Tx,
  settings: ReferralSettings,
): Promise<Map<string, string>> {
  const ids = [settings.referrer, settings.referee]
    .filter((r): r is Extract<ReferralReward, { type: "voucher" }> => r.type === "voucher")
    .map((r) => r.rewardItemId);
  if (ids.length === 0) return new Map();
  const rows = await tx
    .select({ id: schema.rewardItems.id, title: schema.rewardItems.title })
    .from(schema.rewardItems)
    .where(inArray(schema.rewardItems.id, ids));
  return new Map(rows.map((r: { id: string; title: string }) => [r.id, r.title]));
}

async function grantOne(
  tx: Tx,
  input: {
    tenantId: string;
    customerId: string;
    reward: ReferralReward;
    reason: string;
    settings: ReferralSettings;
    staffId: string | null;
    outletId: string | null;
  },
): Promise<ReferralReward> {
  if (input.reward.type === "points") {
    await tx.insert(schema.pointEvents).values({
      tenantId: input.tenantId,
      customerId: input.customerId,
      delta: input.reward.points,
      source: "referral",
      reason: input.reason,
      staffId: input.staffId,
      outletId: input.outletId,
    });
    return input.reward;
  }
  if (input.reward.type === "voucher") {
    const [item] = await tx
      .select({ id: schema.rewardItems.id })
      .from(schema.rewardItems)
      .where(
        and(
          eq(schema.rewardItems.id, input.reward.rewardItemId),
          eq(schema.rewardItems.active, true),
        ),
      );
    // The catalog item was hidden or removed since the settings were saved:
    // grant nothing rather than a coupon for a reward that no longer exists.
    if (!item) return { type: "none" };
    await tx.insert(schema.redemptions).values({
      tenantId: input.tenantId,
      rewardItemId: item.id,
      customerId: input.customerId,
      code: generateRedemptionCode(),
      pointsCost: 0,
      expiresAt: referralVoucherExpiry(input.settings),
      outletId: input.outletId,
      grantSource: "referral",
    });
    return input.reward;
  }
  return { type: "none" };
}

/** The friend's FIRST stamp just landed: pay both sides per the current
 * settings and close the referral. Returns null when nothing was pending. */
export async function qualifyReferralOnFirstStamp(
  tx: Tx,
  input: {
    tenantId: string;
    refereeCustomerId: string;
    staffId: string | null;
    outletId: string | null;
    actor: { type: string; id: string };
  },
): Promise<GrantedReferral | null> {
  const [pending] = await tx
    .select()
    .from(schema.referrals)
    .where(
      and(
        eq(schema.referrals.refereeCustomerId, input.refereeCustomerId),
        eq(schema.referrals.state, "pending"),
      ),
    )
    .limit(1);
  if (!pending) return null;
  const program = await readReferralProgram(tx);
  if (!program.live) return null;

  const people = await tx
    .select({ id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone })
    .from(schema.customers)
    .where(inArray(schema.customers.id, [pending.referrerCustomerId, input.refereeCustomerId]));
  const nameOf = (id: string) => {
    const p = people.find((x: { id: string }) => x.id === id);
    return (p?.name as string | null) ?? "a friend";
  };
  const referrerName = nameOf(pending.referrerCustomerId);
  const refereeName = nameOf(input.refereeCustomerId);
  const titles = await rewardTitlesFor(tx, program.settings);

  const base = { tenantId: input.tenantId, settings: program.settings, staffId: input.staffId, outletId: input.outletId };
  const referrerGot = await grantOne(tx, {
    ...base,
    customerId: pending.referrerCustomerId,
    reward: program.settings.referrer,
    reason: `Invite reward: ${refereeName} made their first visit`,
  });
  const refereeGot = await grantOne(tx, {
    ...base,
    customerId: input.refereeCustomerId,
    reward: program.settings.referee,
    reason: `Welcome reward from ${referrerName}'s invite`,
  });

  const now = new Date();
  await tx
    .update(schema.referrals)
    .set({ state: "rewarded", qualifiedAt: now, referrerReward: referrerGot, refereeReward: refereeGot })
    .where(eq(schema.referrals.id, pending.id));
  await tx.insert(schema.auditLog).values({
    tenantId: input.tenantId,
    actorType: input.actor.type,
    actorId: input.actor.id,
    action: "referral.rewarded",
    entity: "referral",
    entityId: pending.id,
    meta: { referrer: pending.referrerCustomerId, referee: input.refereeCustomerId, referrerGot, refereeGot },
  });

  return {
    referrerName,
    refereeName,
    referrerReward: describeReward(referrerGot, titles),
    refereeReward: describeReward(refereeGot, titles),
  };
}
