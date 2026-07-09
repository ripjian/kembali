/**
 * Demo seed: one tenant (Corner Coffee), one outlet, one 9-stamp program,
 * three customers with cards in different states. Idempotent — fixed UUIDs
 * + ON CONFLICT DO NOTHING, safe to re-run.
 *
 * Runs as the migration/owner role (RLS does not apply to seeding); the
 * apps themselves always go through `withTenant` + the `kembali_app` role.
 */
import { hashPassword } from "@kembali/core";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import * as schema from "./schema";

type SeedDb = PgDatabase<PgQueryResultHKT, typeof schema>;

const T = "11111111-1111-4111-8111-111111111111";

/** DEV/DEMO credentials — for local testing only, never a production
 * deployment. Rotate/remove before real customer data exists. */
export const SEED_LOGINS = {
  platformAdmin: { email: "admin@kembali.app", password: "KembaliAdmin1!" },
  merchantOwner: { email: "nadia@cornercoffee.example", password: "CornerCoffee1!" },
  merchantCashier: { email: "farid@cornercoffee.example", password: "CornerStaff1!" },
  customerPhone: "+60123456701",
} as const;

export const SEED_IDS = {
  tenant: T,
  outlet: "22222222-2222-4222-8222-222222222201",
  staffOwner: "33333333-3333-4333-8333-333333333301",
  staffCashier: "33333333-3333-4333-8333-333333333302",
  program: "44444444-4444-4444-8444-444444444401",
  customers: {
    aisyah: "55555555-5555-4555-8555-555555555501",
    mingWei: "55555555-5555-4555-8555-555555555502",
    priya: "55555555-5555-4555-8555-555555555503",
  },
  cards: {
    aisyah: "66666666-6666-4666-8666-666666666601",
    mingWei: "66666666-6666-4666-8666-666666666602",
    priya: "66666666-6666-4666-8666-666666666603",
  },
  reward: "77777777-7777-4777-8777-777777777701",
  platformAdmin: "99999999-0000-4000-8000-000000000001",
  rewardItems: {
    freeCoffee: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01",
    pastry: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02",
    toteBag: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03",
    retiredMug: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04",
  },
  pointAdjustment: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01",
} as const;

function eventId(n: number): string {
  return `88888888-8888-4888-8888-8888888888${String(n).padStart(2, "0")}`;
}

function pointEventId(n: number): string {
  return `bbbbbbbb-bbbb-4bbb-8bbb-cccccccccc${String(n).padStart(2, "0")}`;
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export interface SeedSummary {
  tenants: number;
  outlets: number;
  staff: number;
  programs: number;
  customers: number;
  cards: number;
  stampEvents: number;
  rewards: number;
  rewardItems: number;
  pointEvents: number;
}

export async function seed(db: SeedDb, now: Date = new Date()): Promise<SeedSummary> {
  await db
    .insert(schema.tenants)
    .values({
      id: T,
      name: "Corner Coffee",
      slug: "corner-coffee",
      plan: "trial",
      billingStatus: "trialing",
      addressLine: "12 Jalan SS15/4",
      city: "Subang Jaya",
      state: "Selangor",
      country: "Malaysia",
      // Default theme = Pandan palette (BRAND.md); white-label overrides later.
      branding: { primaryColor: "#0F3D32", accentColor: "#E0684B" },
    })
    .onConflictDoNothing();

  await db
    .insert(schema.outlets)
    .values({
      id: SEED_IDS.outlet,
      tenantId: T,
      name: "Corner Coffee — SS15 Subang Jaya",
      lat: 3.0762,
      lng: 101.5901,
      timezone: "Asia/Kuala_Lumpur",
    })
    .onConflictDoNothing();

  await db
    .insert(schema.staffUsers)
    .values([
      {
        id: SEED_IDS.staffOwner,
        tenantId: T,
        email: SEED_LOGINS.merchantOwner.email,
        name: "Nadia Rahman",
        role: "owner",
        passwordHash: hashPassword(SEED_LOGINS.merchantOwner.password),
        outletIds: [SEED_IDS.outlet],
      },
      {
        id: SEED_IDS.staffCashier,
        tenantId: T,
        email: SEED_LOGINS.merchantCashier.email,
        name: "Farid Iskandar",
        role: "cashier",
        passwordHash: hashPassword(SEED_LOGINS.merchantCashier.password),
        outletIds: [SEED_IDS.outlet],
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.platformAdmins)
    .values({
      id: SEED_IDS.platformAdmin,
      email: SEED_LOGINS.platformAdmin.email,
      name: "System Admin",
      passwordHash: hashPassword(SEED_LOGINS.platformAdmin.password),
    })
    .onConflictDoNothing();

  await db
    .insert(schema.programs)
    .values({
      id: SEED_IDS.program,
      tenantId: T,
      name: "Coffee Card",
      stampsRequired: 9,
      rewardDefinitions: [
        { type: "free_drink", title: "Free coffee of your choice" },
      ],
      expiryRules: { rewardValidDays: 30 },
    })
    .onConflictDoNothing();

  await db
    .insert(schema.customers)
    .values([
      {
        id: SEED_IDS.customers.aisyah,
        tenantId: T,
        phone: "+60123456701",
        name: "Aisyah binti Yusof",
        language: "ms",
        birthday: "1998-04-12",
        // PDPA: opted in per channel, explicitly
        marketingOptIns: { whatsapp: true },
      },
      {
        id: SEED_IDS.customers.mingWei,
        tenantId: T,
        phone: "+60123456702",
        email: "mingwei@example.com",
        name: "Tan Ming Wei",
        language: "en",
        marketingOptIns: { whatsapp: true, email: true },
      },
      {
        id: SEED_IDS.customers.priya,
        tenantId: T,
        phone: "+60123456703",
        name: "Priya Nair",
        language: "en",
        marketingOptIns: {},
      },
    ])
    .onConflictDoNothing();

  // stamps_count below is a projection and MUST equal the number of
  // stamp_events inserted per card.
  const stamps: Array<{ cardId: string; count: number; customerId: string }> = [
    { cardId: SEED_IDS.cards.aisyah, customerId: SEED_IDS.customers.aisyah, count: 4 },
    { cardId: SEED_IDS.cards.mingWei, customerId: SEED_IDS.customers.mingWei, count: 9 },
    { cardId: SEED_IDS.cards.priya, customerId: SEED_IDS.customers.priya, count: 1 },
  ];

  await db
    .insert(schema.cards)
    .values(
      stamps.map(({ cardId, customerId, count }) => ({
        id: cardId,
        tenantId: T,
        customerId,
        programId: SEED_IDS.program,
        stampsCount: count,
        status: count >= 9 ? ("completed" as const) : ("active" as const),
      })),
    )
    .onConflictDoNothing();

  let n = 0;
  const events = stamps.flatMap(({ cardId, count }) =>
    Array.from({ length: count }, (_, i) => ({
      id: eventId(++n),
      tenantId: T,
      cardId,
      outletId: SEED_IDS.outlet,
      staffId: SEED_IDS.staffCashier,
      source: "qr" as const,
      // deterministic demo amounts: RM12.00–RM25.50
      amountCents: 1200 + ((n * 150) % 1350),
      createdAt: daysAgo(now, (count - i) * 3),
    })),
  );
  await db.insert(schema.stampEvents).values(events).onConflictDoNothing();

  await db
    .insert(schema.rewards)
    .values({
      id: SEED_IDS.reward,
      tenantId: T,
      cardId: SEED_IDS.cards.mingWei,
      type: "free_drink",
      state: "earned",
      expiresAt: daysAgo(now, -30),
    })
    .onConflictDoNothing();

  const rewardItems = [
    {
      id: SEED_IDS.rewardItems.freeCoffee,
      title: "Free coffee of your choice",
      description: "Any drink on the menu, hot or iced.",
      pointsCost: 120,
      active: true,
    },
    {
      id: SEED_IDS.rewardItems.pastry,
      title: "Pastry of the day",
      description: "One fresh pastry from the counter display.",
      pointsCost: 80,
      active: true,
    },
    {
      id: SEED_IDS.rewardItems.toteBag,
      title: "Corner Coffee tote bag",
      description: "Canvas tote with the shop logo.",
      pointsCost: 250,
      active: true,
    },
    {
      id: SEED_IDS.rewardItems.retiredMug,
      title: "Ceramic mug (retired)",
      description: "Old design — kept for redemption history.",
      pointsCost: 200,
      active: false,
    },
  ];
  await db
    .insert(schema.rewardItems)
    .values(rewardItems.map((item) => ({ ...item, tenantId: T })))
    .onConflictDoNothing();

  // Points mirror the stamp ledger at the default 1 point per RM1 rate.
  // ON CONFLICT DO NOTHING keeps re-runs from double-counting the
  // points_balance projection (the trigger only fires on real inserts).
  const stampsByCustomer = new Map(
    stamps.map(({ cardId, customerId }) => [cardId, customerId]),
  );
  const pointEvents = events.map((event, i) => ({
    id: pointEventId(i + 1),
    tenantId: T,
    customerId: stampsByCustomer.get(event.cardId)!,
    delta: Math.floor(event.amountCents / 100),
    source: "transaction" as const,
    staffId: SEED_IDS.staffCashier,
    stampEventId: event.id,
    createdAt: event.createdAt,
  }));
  await db.insert(schema.pointEvents).values(pointEvents).onConflictDoNothing();
  await db
    .insert(schema.pointEvents)
    .values({
      id: SEED_IDS.pointAdjustment,
      tenantId: T,
      customerId: SEED_IDS.customers.aisyah,
      delta: 25,
      source: "adjustment",
      reason: "Welcome bonus",
      staffId: SEED_IDS.staffOwner,
      createdAt: daysAgo(now, 10),
    })
    .onConflictDoNothing();

  return {
    tenants: 1,
    outlets: 1,
    staff: 2,
    programs: 1,
    customers: 3,
    cards: 3,
    stampEvents: events.length,
    rewards: 1,
    rewardItems: rewardItems.length,
    pointEvents: pointEvents.length + 1,
  };
}
