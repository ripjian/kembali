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

const tenantMatch = sql`tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid`;

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
export const sessionKind = pgEnum("session_kind", ["customer", "staff", "platform"]);
export const cardStatus = pgEnum("card_status", ["active", "completed", "revoked"]);
export const stampSource = pgEnum("stamp_source", ["qr", "manual"]);
export const rewardState = pgEnum("reward_state", ["earned", "redeemed", "expired"]);
export const referralState = pgEnum("referral_state", ["pending", "completed", "rewarded"]);
export const pointEventSource = pgEnum("point_event_source", [
  "transaction",
  "adjustment",
  "redemption",
]);
export const redemptionState = pgEnum("redemption_state", [
  "reserved",
  "redeemed",
  "expired",
  "cancelled",
]);
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
    /** Square brand logo — data URL in v1, object storage later. */
    logoUrl: text("logo_url"),
    addressLine: text("address_line"),
    city: text("city"),
    state: text("state"),
    country: text("country").notNull().default("Malaysia"),
    /** Feature-module toggles managed by the platform admin. */
    modules: jsonb("modules")
      .notNull()
      .default({ stamps: true, scan: true, reports: true }),
    /** Per-role permission overrides; defaults live in @kembali/core. */
    rolePermissions: jsonb("role_permissions").notNull().default({}),
    /** RM→points conversion: points earned per RM1 keyed in at the counter.
     * 0 pauses earning without hiding balances (Phase 2). */
    pointsPerRm: doublePrecision("points_per_rm").notNull().default(1),
    createdAt: createdAt(),
  },
  () => [
    // A tenant may only see its own row.
    pgPolicy("tenants_tenant_isolation", {
      for: "select",
      to: appRole,
      using: sql`id = nullif(current_setting('app.tenant_id', true), '')::uuid`,
    }),
    // …and update it (role permissions, branding). App code gates WHO may
    // (owners with manageTeam); RLS guarantees only the own row is reachable.
    pgPolicy("tenants_tenant_update", {
      for: "update",
      to: appRole,
      using: sql`id = nullif(current_setting('app.tenant_id', true), '')::uuid`,
      withCheck: sql`id = nullif(current_setting('app.tenant_id', true), '')::uuid`,
    }),
    // Platform admins manage all tenants — the app sets this GUC only
    // after verifying a platform session (client.ts withPlatform).
    pgPolicy("tenants_platform_all", {
      for: "all",
      to: appRole,
      using: sql`current_setting('app.platform_admin', true) = 'true'`,
      withCheck: sql`current_setting('app.platform_admin', true) = 'true'`,
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
    /** scrypt hash (packages/core auth) — null until an invite is accepted */
    passwordHash: text("password_hash"),
    /** Cashiers are scoped to assigned outlets (ROADMAP §5). */
    outletIds: uuid("outlet_ids").array().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [
    tenantPolicy("staff_users"),
    // Platform admins create merchant logins and reset passwords.
    pgPolicy("staff_users_platform_all", {
      for: "all",
      to: appRole,
      using: sql`current_setting('app.platform_admin', true) = 'true'`,
      withCheck: sql`current_setting('app.platform_admin', true) = 'true'`,
    }),
    uniqueIndex("staff_users_tenant_email_uq").on(t.tenantId, t.email),
  ],
);

/* ---- global auth tables (not tenant data: keyed by unguessable secrets,
        accessed before a tenant context exists) ------------------------- */

export const platformAdmins = pgTable(
  "platform_admins",
  {
    id: id(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: createdAt(),
  },
  () => [
    pgPolicy("platform_admins_app_access", {
      for: "all",
      to: appRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    /** sha256 of the cookie token — the raw token never touches the DB */
    tokenHash: text("token_hash").notNull().unique(),
    kind: sessionKind("kind").notNull(),
    subjectId: uuid("subject_id").notNull(),
    /** null for platform sessions */
    tenantId: uuid("tenant_id").references(() => tenants.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    pgPolicy("sessions_app_access", {
      for: "all",
      to: appRole,
      using: sql`true`,
      withCheck: sql`true`,
    }),
    index("sessions_expiry_idx").on(t.expiresAt),
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
    /** Projection of point_events, maintained ONLY by the DB trigger in
     * migration 0009 — direct UPDATEs to this column are rejected. */
    pointsBalance: integer("points_balance").notNull().default(0),
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
    /** Transaction amount captured at the counter (sen). v1: lives on the
     * ledger event; a dedicated payments table can come later. */
    amountCents: integer("amount_cents"),
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

/* ---- points & rewards catalog (Phase 2, ROADMAP §4) --------------------- */

export const rewardItems = pgTable(
  "reward_items",
  {
    id: id(),
    tenantId: tenantId(),
    title: text("title").notNull(),
    description: text("description"),
    /** Square image — data URL in v1, object storage later (same as logos). */
    imageUrl: text("image_url"),
    pointsCost: integer("points_cost").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [tenantPolicy("reward_items"), index("reward_items_tenant_idx").on(t.tenantId)],
);

export const redemptions = pgTable(
  "redemptions",
  {
    id: id(),
    tenantId: tenantId(),
    rewardItemId: uuid("reward_item_id")
      .notNull()
      .references(() => rewardItems.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    /** Single-use coupon code shown as QR + text. Globally unique; the
     * unique index is what makes concurrent confirms safe. */
    code: text("code").notNull().unique(),
    state: redemptionState("state").notNull().default("reserved"),
    /** Price snapshot at reserve time — catalog edits don't reprice coupons. */
    pointsCost: integer("points_cost").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    redeemedByStaffId: uuid("redeemed_by_staff_id").references(() => staffUsers.id),
    outletId: uuid("outlet_id").references(() => outlets.id),
    createdAt: createdAt(),
  },
  (t) => [
    tenantPolicy("redemptions"),
    index("redemptions_customer_idx").on(t.customerId, t.createdAt),
  ],
);

export const pointEvents = pgTable(
  "point_events",
  {
    id: id(),
    tenantId: tenantId(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    /** Positive = earned/added, negative = spent/deducted. */
    delta: integer("delta").notNull(),
    source: pointEventSource("source").notNull(),
    /** Required for adjustments — customer-visible in their history. */
    reason: text("reason"),
    staffId: uuid("staff_id").references(() => staffUsers.id),
    /** Set for source=transaction: the stamp event the points came from. */
    stampEventId: uuid("stamp_event_id").references(() => stampEvents.id),
    /** Set for source=redemption: the coupon the points paid for. */
    redemptionId: uuid("redemption_id").references(() => redemptions.id),
    createdAt: createdAt(),
  },
  (t) => [
    // Append-only ledger, same treatment as stamp_events: SELECT + INSERT
    // policies only; migration 0009 blocks UPDATE/DELETE with a trigger and
    // maintains customers.points_balance.
    pgPolicy("point_events_tenant_select", {
      for: "select",
      to: appRole,
      using: tenantMatch,
    }),
    pgPolicy("point_events_tenant_insert", {
      for: "insert",
      to: appRole,
      withCheck: tenantMatch,
    }),
    index("point_events_customer_idx").on(t.customerId, t.createdAt),
  ],
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

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: id(),
    tenantId: tenantId(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [tenantPolicy("otp_codes"), index("otp_codes_phone_idx").on(t.tenantId, t.phone)],
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
    // Platform actions (create tenant, reset password, toggle modules)
    // must be auditable across tenants.
    pgPolicy("audit_log_platform_insert", {
      for: "insert",
      to: appRole,
      withCheck: sql`current_setting('app.platform_admin', true) = 'true'`,
    }),
    index("audit_log_tenant_idx").on(t.tenantId, t.createdAt),
  ],
);
