/**
 * Kembali schema v1 — ROADMAP §4.
 *
 * Rules enforced here (CLAUDE.md conventions):
 *  - Every tenant table carries `tenant_id` + a Postgres RLS policy scoping
 *    the `kembali_app` role to `current_setting('app.tenant_id')`.
 *  - `stamp_events` and `audit_log` are append-only ledgers: the app role
 *    only gets SELECT/INSERT policies, and migration 0001 adds triggers that
 *    reject UPDATE/DELETE for everyone (owner included).
 *  - `cards.stamps_count` is a denormalized projection of `stamp_events`.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Runtime role the apps connect through — never the table owner, so RLS
 * always applies. Production login users are members of this role. */
export const appRole = pgRole("kembali_app");

const tenantMatch = sql`tenant_id = current_setting('app.tenant_id', true)::uuid`;

/** Standard full-access-within-own-tenant policy for the app role. */
function tenantPolicy(table: string) {
  return pgPolicy(`${table}_tenant_isolation`, {
    for: "all",
    to: appRole,
    using: tenantMatch,
    withCheck: tenantMatch,
  });
}

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const tenantId = () =>
  uuid("tenant_id")
    .notNull()
    .references(() => tenants.id);

export const staffRole = pgEnum("staff_role", ["owner", "manager", "cashier"]);
export const cardStatus = pgEnum("card_status", ["active", "completed", "revoked"]);
export const stampSource = pgEnum("stamp_source", ["qr", "manual"]);
export const rewardState = pgEnum("reward_state", ["earned", "redeemed", "expired"]);
export const referralState = pgEnum("referral_state", ["pending", "completed", "rewarded"]);
export const walletPlatform = pgEnum("wallet_platform", ["apple", "google"]);
export const messageChannel = pgEnum("message_channel", ["whatsapp", "sms", "email", "push"]);
export const messageStatus = pgEnum("message_status", ["queued", "sent", "delivered", "failed"]);

export const tenants = pgTable(
  "tenants",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    plan: text("plan").notNull().default("trial"),
    billingStatus: text("billing_status").notNull().default("trialing"),
    /** logo URL, brand colors, custom domain — white-label (ROADMAP §1) */
    branding: jsonb("branding").notNull().default({}),
    createdAt: createdAt(),
  },
  () => [
    // A tenant may only see its own row.
    pgPolicy("tenants_tenant_isolation", {
      for: "select",
      to: appRole,
      using: sql`id = current_setting('app.tenant_id', true)::uuid`,
    }),
  ],
);

export const outlets = pgTable(
  "outlets",
  {
    id: id(),
    tenantId: tenantId(),
    name: text("name").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    timezone: text("timezone").notNull().default("Asia/Kuala_Lumpur"),
    createdAt: createdAt(),
  },
  (t) => [tenantPolicy("outlets"), index("outlets_tenant_idx").on(t.tenantId)],
);

export const staffUsers = pgTable(
  "staff_users",
  {
    id: id(),
    tenantId: tenantId(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: staffRole("role").notNull().default("cashier"),
    /** Cashiers are scoped to assigned outlets (ROADMAP §5). */
    outletIds: uuid("outlet_ids").array().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [
    tenantPolicy("staff_users"),
    uniqueIndex("staff_users_tenant_email_uq").on(t.tenantId, t.email),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: id(),
    tenantId: tenantId(),
    phone: text("phone"),
    email: text("email"),
    name: text("name"),
    language: text("language").notNull().default("en"),
    birthday: date("birthday"),
    /** PDPA: explicit opt-in per channel, e.g. {"whatsapp": true} (ROADMAP §5) */
    marketingOptIns: jsonb("marketing_opt_ins").notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    tenantPolicy("customers"),
    // phone/email unique per tenant (ROADMAP §4) — partial so nulls are fine
    uniqueIndex("customers_tenant_phone_uq")
      .on(t.tenantId, t.phone)
      .where(sql`phone is not null`),
    uniqueIndex("customers_tenant_email_uq")
      .on(t.tenantId, t.email)
      .where(sql`email is not null`),
  ],
);

export const programs = pgTable(
  "programs",
  {
    id: id(),
    tenantId: tenantId(),
    name: text("name").notNull(),
    stampsRequired: integer("stamps_required").notNull(),
    rewardDefinitions: jsonb("reward_definitions").notNull().default([]),
    expiryRules: jsonb("expiry_rules").notNull().default({}),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [tenantPolicy("programs"), index("programs_tenant_idx").on(t.tenantId)],
);

export const cards = pgTable(
  "cards",
  {
    id: id(),
    tenantId: tenantId(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id),
    /** Projection of stamp_events — never the source of truth. */
    stampsCount: integer("stamps_count").notNull().default(0),
    status: cardStatus("status").notNull().default("active"),
    createdAt: createdAt(),
  },
  (t) => [
    tenantPolicy("cards"),
    uniqueIndex("cards_customer_program_uq").on(t.tenantId, t.customerId, t.programId),
  ],
);

export const stampEvents = pgTable(
  "stamp_events",
  {
    id: id(),
    tenantId: tenantId(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id),
    outletId: uuid("outlet_id")
      .notNull()
      .references(() => outlets.id),
    staffId: uuid("staff_id").references(() => staffUsers.id),
    source: stampSource("source").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    // Append-only ledger: SELECT + INSERT only. No update/delete policy
    // exists, and migration 0001 adds a trigger blocking them outright.
    pgPolicy("stamp_events_tenant_select", {
      for: "select",
      to: appRole,
      using: tenantMatch,
    }),
    pgPolicy("stamp_events_tenant_insert", {
      for: "insert",
      to: appRole,
      withCheck: tenantMatch,
    }),
    index("stamp_events_card_idx").on(t.cardId, t.createdAt),
  ],
);

export const rewards = pgTable(
  "rewards",
  {
    id: id(),
    tenantId: tenantId(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id),
    type: text("type").notNull(),
    state: rewardState("state").notNull().default("earned"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [tenantPolicy("rewards"), index("rewards_card_idx").on(t.cardId)],
);

export const referrals = pgTable(
  "referrals",
  {
    id: id(),
    tenantId: tenantId(),
    referrerCustomerId: uuid("referrer_customer_id")
      .notNull()
      .references(() => customers.id),
    refereeCustomerId: uuid("referee_customer_id").references(() => customers.id),
    state: referralState("state").notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => [tenantPolicy("referrals"), index("referrals_tenant_idx").on(t.tenantId)],
);

export const walletPasses = pgTable(
  "wallet_passes",
  {
    id: id(),
    tenantId: tenantId(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id),
    platform: walletPlatform("platform").notNull(),
    serial: text("serial").notNull(),
    /** Apple PassKit web-service per-pass authenticationToken (ROADMAP §5).
     * Generated per pass at issue time — a data-plane credential, not a
     * repo secret. */
    authToken: text("auth_token").notNull(),
    lastPushedAt: timestamp("last_pushed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    tenantPolicy("wallet_passes"),
    uniqueIndex("wallet_passes_platform_serial_uq").on(t.platform, t.serial),
  ],
);

export const deviceRegistrations = pgTable(
  "device_registrations",
  {
    id: id(),
    tenantId: tenantId(),
    walletPassId: uuid("wallet_pass_id")
      .notNull()
      .references(() => walletPasses.id),
    deviceLibraryIdentifier: text("device_library_identifier").notNull(),
    pushToken: text("push_token").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    tenantPolicy("device_registrations"),
    uniqueIndex("device_registrations_device_pass_uq").on(
      t.deviceLibraryIdentifier,
      t.walletPassId,
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: id(),
    tenantId: tenantId(),
    customerId: uuid("customer_id").references(() => customers.id),
    channel: messageChannel("channel").notNull(),
    template: text("template").notNull(),
    status: messageStatus("status").notNull().default("queued"),
    costCredits: integer("cost_credits").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [tenantPolicy("messages"), index("messages_tenant_idx").on(t.tenantId)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    tenantId: tenantId(),
    actorType: text("actor_type").notNull(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: uuid("entity_id"),
    meta: jsonb("meta").notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    // Append-only, same treatment as stamp_events.
    pgPolicy("audit_log_tenant_select", {
      for: "select",
      to: appRole,
      using: tenantMatch,
    }),
    pgPolicy("audit_log_tenant_insert", {
      for: "insert",
      to: appRole,
      withCheck: tenantMatch,
    }),
    index("audit_log_tenant_idx").on(t.tenantId, t.createdAt),
  ],
);
