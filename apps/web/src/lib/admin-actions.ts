"use server";

import { redirect } from "next/navigation";

import {
  hashPassword,
  verifyPassword,
  PERMISSION_KEYS,
  type RolePermissionMatrix,
} from "@kembali/core";
import { schema, withPlatform, withTenant, type KembaliDb } from "@kembali/db";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { destroySessions, getAdminContext, startAdminSession } from "./auth";
import { getDb } from "./db";
import { modulesSchema } from "./modules";
import { authorizeTenantAction } from "./panel";
import { normalizePhone } from "./phone";
import { PLAN_TYPES } from "./plans";

/* Server actions for the admin panel. Authorization = session identity +
 * per-role permission (lib/panel.ts) + RLS underneath. Privileged/platform
 * actions write to audit_log (SECURITY.md rule 9). */

type Tx = Pick<KembaliDb, "insert">;

async function audit(
  tx: Tx,
  entry: {
    tenantId: string;
    actorType: string;
    actorId?: string;
    action: string;
    entity: string;
    entityId?: string;
    meta?: Record<string, unknown>;
  },
) {
  await tx.insert(schema.auditLog).values({
    tenantId: entry.tenantId,
    actorType: entry.actorType,
    actorId: entry.actorId,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    meta: entry.meta ?? {},
  });
}

/* ---- auth ------------------------------------------------------------- */

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function adminLogin(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/admin/login?error=1");
  const { email, password } = parsed.data;
  const db = await getDb();

  const [admin] = await db
    .select()
    .from(schema.platformAdmins)
    .where(eq(schema.platformAdmins.email, email));
  if (admin && verifyPassword(password, admin.passwordHash)) {
    await startAdminSession(db, "platform", admin.id, null);
    redirect("/admin");
  }

  const staff = await withPlatform(db, async (tx) => {
    const [row] = await tx
      .select()
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.email, email));
    return row ?? null;
  });
  if (staff?.passwordHash && verifyPassword(password, staff.passwordHash)) {
    await startAdminSession(db, "staff", staff.id, staff.tenantId);
    redirect("/admin");
  }
  redirect("/admin/login?error=1");
}

export async function adminLogout() {
  await destroySessions();
  redirect("/admin/login");
}

/* ---- shared field schemas ---------------------------------------------- */

const logoSchema = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp);base64,/, "Logo must be a PNG, JPG or WebP")
  .max(700_000, "Logo must be under 512 KB")
  .or(z.literal(""));

const merchantProfileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  plan: z.enum(PLAN_TYPES),
  addressLine: z.string().trim().max(200),
  city: z.string().trim().max(80),
  state: z.string().trim().max(80),
  country: z.string().trim().min(2).max(80),
  logoDataUrl: logoSchema,
  modules: modulesSchema,
});

function readMerchantProfile(formData: FormData) {
  return merchantProfileSchema.safeParse({
    name: formData.get("name"),
    plan: formData.get("plan"),
    addressLine: formData.get("addressLine") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    country: formData.get("country") || "Malaysia",
    logoDataUrl: formData.get("logoDataUrl") ?? "",
    modules: {
      stamps: formData.get("mod_stamps") === "on",
      scan: formData.get("mod_scan") === "on",
      reports: formData.get("mod_reports") === "on",
      points: formData.get("mod_points") === "on",
      rewards: formData.get("mod_rewards") === "on",
    },
  });
}

/* ---- platform: merchants ------------------------------------------------ */

async function requirePlatform() {
  const admin = await getAdminContext();
  if (!admin || admin.kind !== "platform") redirect("/admin");
  return admin;
}

const newMerchantExtraSchema = z.object({
  outletName: z.string().trim().min(2).max(120),
  ownerName: z.string().trim().min(2).max(120),
  ownerEmail: z.email(),
  ownerPassword: z.string().min(8),
  stampsRequired: z.coerce.number().int().min(2).max(30),
  rewardTitle: z.string().trim().min(2).max(120),
});

export async function createTenant(formData: FormData) {
  const admin = await requirePlatform();
  const profile = readMerchantProfile(formData);
  const extra = newMerchantExtraSchema.safeParse({
    outletName: formData.get("outletName"),
    ownerName: formData.get("ownerName"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPassword: formData.get("ownerPassword"),
    stampsRequired: formData.get("stampsRequired") ?? 10,
    rewardTitle: formData.get("rewardTitle"),
  });
  if (!profile.success || !extra.success) redirect("/admin/merchants?error=invalid");
  const p = profile.data;
  const slug = p.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // reserved: these collide with static /admin routes
  if (!slug || ["merchants", "login"].includes(slug)) {
    redirect("/admin/merchants?error=invalid");
  }

  const db = await getDb();
  const tenantId = await withPlatform(db, async (tx) => {
    const [tenant] = await tx
      .insert(schema.tenants)
      .values({
        name: p.name,
        slug,
        plan: p.plan,
        addressLine: p.addressLine || null,
        city: p.city || null,
        state: p.state || null,
        country: p.country,
        logoUrl: p.logoDataUrl || null,
        modules: p.modules,
      })
      .onConflictDoNothing()
      .returning();
    if (!tenant) return null;
    await tx.insert(schema.staffUsers).values({
      tenantId: tenant.id,
      email: extra.data.ownerEmail,
      name: extra.data.ownerName,
      role: "owner",
      passwordHash: hashPassword(extra.data.ownerPassword),
    });
    await audit(tx, {
      tenantId: tenant.id,
      actorType: "platform",
      actorId: admin.subjectId,
      action: "tenant.created",
      entity: "tenant",
      entityId: tenant.id,
      meta: { slug, plan: p.plan },
    });
    return tenant.id;
  });
  if (!tenantId) redirect("/admin/merchants?error=exists");

  await withTenant(db, tenantId, async (tx) => {
    await tx
      .insert(schema.outlets)
      .values({ tenantId, name: extra.data.outletName });
    await tx.insert(schema.programs).values({
      tenantId,
      name: "Loyalty card",
      stampsRequired: extra.data.stampsRequired,
      rewardDefinitions: [{ type: "reward", title: extra.data.rewardTitle }],
      expiryRules: { rewardValidDays: 30 },
    });
  });
  redirect("/admin/merchants?created=1");
}

export async function updateTenant(formData: FormData) {
  const admin = await requirePlatform();
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  const profile = readMerchantProfile(formData);
  if (!tenantId.success || !profile.success) {
    redirect("/admin/merchants?error=invalid");
  }
  const p = profile.data;

  const db = await getDb();
  await withPlatform(db, async (tx) => {
    await tx
      .update(schema.tenants)
      .set({
        // slug intentionally stable — it is the merchant's panel path
        name: p.name,
        plan: p.plan,
        addressLine: p.addressLine || null,
        city: p.city || null,
        state: p.state || null,
        country: p.country,
        ...(p.logoDataUrl ? { logoUrl: p.logoDataUrl } : {}),
        modules: p.modules,
      })
      .where(eq(schema.tenants.id, tenantId.data));
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: "platform",
      actorId: admin.subjectId,
      action: "tenant.updated",
      entity: "tenant",
      entityId: tenantId.data,
      meta: { plan: p.plan, modules: p.modules },
    });
  });
  redirect("/admin/merchants?saved=1");
}

/* ---- team --------------------------------------------------------------- */

export async function saveRolePermissions(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  if (!tenantId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(tenantId.data, "manageTeam");

  const matrix = {} as RolePermissionMatrix;
  for (const role of ["owner", "manager", "cashier"] as const) {
    matrix[role] = {} as RolePermissionMatrix[typeof role];
    for (const key of PERMISSION_KEYS) {
      matrix[role][key] = formData.get(`perm.${role}.${key}`) === "on";
    }
  }
  // Owners keep team management for themselves — never lock everyone out.
  matrix.owner.manageTeam = true;

  const db = await getDb();
  await withTenant(db, tenantId.data, async (tx) => {
    await tx
      .update(schema.tenants)
      .set({ rolePermissions: matrix })
      .where(eq(schema.tenants.id, tenantId.data));
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "tenant.role_permissions_changed",
      entity: "tenant",
      entityId: tenantId.data,
      meta: matrix,
    });
  });
  redirect(`/admin/${slug}/team?permissions=1`);
}

const staffFieldsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  role: z.enum(["owner", "manager", "cashier"]),
});

export async function createStaff(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  if (!tenantId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(tenantId.data, "manageTeam");
  const parsed = staffFieldsSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  const password = z.string().min(8).safeParse(formData.get("password"));
  if (!parsed.success || !password.success) {
    redirect(`/admin/${slug}/team?error=invalid`);
  }

  const db = await getDb();
  const created = await withTenant(db, tenantId.data, async (tx) => {
    const [existing] = await tx
      .select({ id: schema.staffUsers.id })
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.email, parsed.data.email));
    if (existing) return false;
    const [row] = await tx
      .insert(schema.staffUsers)
      .values({
        tenantId: tenantId.data,
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash: hashPassword(password.data),
      })
      .returning({ id: schema.staffUsers.id });
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "staff.created",
      entity: "staff_user",
      entityId: row?.id,
      meta: { role: parsed.data.role },
    });
    return true;
  });
  redirect(`/admin/${slug}/team?${created ? "added=1" : "error=exists"}`);
}

export async function updateStaff(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  const staffId = z.uuid().safeParse(formData.get("staffId"));
  if (!tenantId.success || !staffId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(tenantId.data, "manageTeam");
  const parsed = staffFieldsSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  // Optional "set new password" — blank means keep the current one.
  const rawPassword = String(formData.get("password") ?? "");
  if (!parsed.success || (rawPassword !== "" && rawPassword.length < 8)) {
    redirect(`/admin/${slug}/team?error=invalid`);
  }

  const db = await getDb();
  const ok = await withTenant(db, tenantId.data, async (tx) => {
    const [target] = await tx
      .select()
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.id, staffId.data));
    if (!target) return false;
    // Don't strand the store: the last owner can't be demoted.
    if (target.role === "owner" && parsed.data.role !== "owner") {
      const [owners] = await tx
        .select({ n: sql`count(*)::int`.mapWith(Number) })
        .from(schema.staffUsers)
        .where(eq(schema.staffUsers.role, "owner"));
      if ((owners?.n ?? 0) <= 1) return "lastowner";
    }
    // Email must stay unique within the store.
    const [clash] = await tx
      .select({ id: schema.staffUsers.id })
      .from(schema.staffUsers)
      .where(
        and(
          eq(schema.staffUsers.email, parsed.data.email),
          ne(schema.staffUsers.id, staffId.data),
        ),
      );
    if (clash) return "exists";

    await tx
      .update(schema.staffUsers)
      .set({
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        ...(rawPassword ? { passwordHash: hashPassword(rawPassword) } : {}),
      })
      .where(eq(schema.staffUsers.id, staffId.data));
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "staff.updated",
      entity: "staff_user",
      entityId: staffId.data,
      meta: { role: parsed.data.role, passwordChanged: Boolean(rawPassword) },
    });
    return true;
  });
  if (ok === "lastowner") redirect(`/admin/${slug}/team?error=lastowner`);
  if (ok === "exists") redirect(`/admin/${slug}/team?error=exists`);
  redirect(`/admin/${slug}/team?saved=1`);
}

export async function deleteStaff(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  const staffId = z.uuid().safeParse(formData.get("staffId"));
  if (!tenantId.success || !staffId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(tenantId.data, "manageTeam");

  // You can't remove yourself.
  if (admin.kind === "staff" && admin.subjectId === staffId.data) {
    redirect(`/admin/${slug}/team?error=self`);
  }

  const db = await getDb();
  const result = await withTenant(db, tenantId.data, async (tx) => {
    const [target] = await tx
      .select()
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.id, staffId.data));
    if (!target) return "gone";
    if (target.role === "owner") {
      const [owners] = await tx
        .select({ n: sql`count(*)::int`.mapWith(Number) })
        .from(schema.staffUsers)
        .where(eq(schema.staffUsers.role, "owner"));
      if ((owners?.n ?? 0) <= 1) return "lastowner";
    }
    // Ledgers reference the staff id and are append-only, so a member with
    // history can't be erased without breaking the record — block it and
    // suggest changing their role instead.
    const [stampRef] = await tx
      .select({ n: sql`count(*)::int`.mapWith(Number) })
      .from(schema.stampEvents)
      .where(eq(schema.stampEvents.staffId, staffId.data));
    const [pointRef] = await tx
      .select({ n: sql`count(*)::int`.mapWith(Number) })
      .from(schema.pointEvents)
      .where(eq(schema.pointEvents.staffId, staffId.data));
    const [redRef] = await tx
      .select({ n: sql`count(*)::int`.mapWith(Number) })
      .from(schema.redemptions)
      .where(eq(schema.redemptions.redeemedByStaffId, staffId.data));
    if ((stampRef?.n ?? 0) + (pointRef?.n ?? 0) + (redRef?.n ?? 0) > 0) {
      return "hasactivity";
    }

    await tx.delete(schema.staffUsers).where(eq(schema.staffUsers.id, staffId.data));
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "staff.deleted",
      entity: "staff_user",
      entityId: staffId.data,
      meta: { name: target.name, role: target.role },
    });
    return "deleted";
  });
  redirect(
    result === "deleted"
      ? `/admin/${slug}/team?deleted=1`
      : `/admin/${slug}/team?error=${result}`,
  );
}

/* ---- customers ----------------------------------------------------------- */

const customerFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().min(8),
  email: z.union([z.email(), z.literal("")]),
  birthday: z.union([z.iso.date(), z.literal("")]),
  optInWhatsapp: z.boolean(),
  optInEmail: z.boolean(),
});

function readCustomerFields(formData: FormData) {
  return customerFieldsSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    birthday: formData.get("birthday") ?? "",
    optInWhatsapp: formData.get("optInWhatsapp") === "on",
    optInEmail: formData.get("optInEmail") === "on",
  });
}

export async function createCustomer(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  if (!tenantId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(
    tenantId.data,
    "manageCustomers",
  );
  const parsed = readCustomerFields(formData);
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!parsed.success || !phone) {
    redirect(`/admin/${slug}/customers/new?error=invalid`);
  }
  const input = parsed.data;

  const db = await getDb();
  const customerId = await withTenant(db, tenantId.data, async (tx) => {
    const [existing] = await tx
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.phone, phone));
    if (existing) return null;
    const [customer] = await tx
      .insert(schema.customers)
      .values({
        tenantId: tenantId.data,
        name: input.name,
        phone,
        email: input.email || null,
        birthday: input.birthday || null,
        marketingOptIns: {
          whatsapp: input.optInWhatsapp,
          email: input.optInEmail,
        },
      })
      .returning();
    if (!customer) return null;
    const [program] = await tx
      .select({ id: schema.programs.id })
      .from(schema.programs)
      .where(eq(schema.programs.active, true))
      .orderBy(asc(schema.programs.createdAt))
      .limit(1);
    if (program) {
      await tx.insert(schema.cards).values({
        tenantId: tenantId.data,
        customerId: customer.id,
        programId: program.id,
      });
    }
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "customer.created",
      entity: "customer",
      entityId: customer.id,
    });
    return customer.id;
  });

  if (!customerId) redirect(`/admin/${slug}/customers/new?error=exists`);
  redirect(`/admin/${slug}/customers/${customerId}`);
}

export async function updateCustomer(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  const customerId = z.uuid().safeParse(formData.get("customerId"));
  if (!tenantId.success || !customerId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(
    tenantId.data,
    "editCustomers",
  );
  const parsed = readCustomerFields(formData);
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!parsed.success || !phone) {
    redirect(`/admin/${slug}/customers/${customerId.data}?error=invalid`);
  }
  const input = parsed.data;

  const db = await getDb();
  await withTenant(db, tenantId.data, async (tx) => {
    await tx
      .update(schema.customers)
      .set({
        name: input.name,
        phone,
        email: input.email || null,
        birthday: input.birthday || null,
        marketingOptIns: {
          whatsapp: input.optInWhatsapp,
          email: input.optInEmail,
        },
      })
      .where(eq(schema.customers.id, customerId.data));
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "customer.updated",
      entity: "customer",
      entityId: customerId.data,
    });
  });
  redirect(`/admin/${slug}/customers/${customerId.data}?saved=1`);
}

/* ---- points (Phase 2) ---------------------------------------------------- */

export async function updatePointsRate(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  const rate = z.coerce.number().min(0).max(1000).safeParse(formData.get("pointsPerRm"));
  if (!tenantId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(tenantId.data, "manageRewards");
  if (!rate.success) redirect(`/admin/${slug}/rewards?error=rate`);

  const db = await getDb();
  await withTenant(db, tenantId.data, async (tx) => {
    await tx
      .update(schema.tenants)
      .set({ pointsPerRm: rate.data })
      .where(eq(schema.tenants.id, tenantId.data));
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "tenant.points_rate_changed",
      entity: "tenant",
      entityId: tenantId.data,
      meta: { pointsPerRm: rate.data },
    });
  });
  redirect(`/admin/${slug}/rewards?saved=rate`);
}

const adjustmentSchema = z.object({
  direction: z.enum(["add", "deduct"]),
  points: z.coerce.number().int().min(1).max(100_000),
  reason: z.string().trim().min(3).max(200),
});

export async function adjustCustomerPoints(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  const customerId = z.uuid().safeParse(formData.get("customerId"));
  if (!tenantId.success || !customerId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(tenantId.data, "adjustPoints");
  const parsed = adjustmentSchema.safeParse({
    direction: formData.get("direction"),
    points: formData.get("points"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    redirect(`/admin/${slug}/customers/${customerId.data}?error=adjust`);
  }
  const delta =
    parsed.data.direction === "add" ? parsed.data.points : -parsed.data.points;

  const db = await getDb();
  const ok = await withTenant(db, tenantId.data, async (tx) => {
    if (delta < 0) {
      // Never let an adjustment push a member below zero.
      const [customer] = await tx
        .select({ balance: schema.customers.pointsBalance })
        .from(schema.customers)
        .where(eq(schema.customers.id, customerId.data))
        .for("update");
      if (!customer || customer.balance + delta < 0) return false;
    }
    const [event] = await tx
      .insert(schema.pointEvents)
      .values({
        tenantId: tenantId.data,
        customerId: customerId.data,
        delta,
        source: "adjustment",
        reason: parsed.data.reason,
        staffId: admin.kind === "staff" ? admin.subjectId : null,
      })
      .returning({ id: schema.pointEvents.id });
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "points.adjusted",
      entity: "point_event",
      entityId: event?.id,
      meta: { delta, reason: parsed.data.reason, customerId: customerId.data },
    });
    return true;
  });
  redirect(
    `/admin/${slug}/customers/${customerId.data}?${ok ? "adjusted=1" : "error=balance"}`,
  );
}

/* ---- rewards catalog (Phase 2) ------------------------------------------- */

const rewardItemSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400),
  pointsCost: z.coerce.number().int().min(1).max(1_000_000),
  active: z.boolean(),
  imageDataUrl: logoSchema,
});

export async function saveRewardItem(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  const rewardItemId = z.uuid().optional().safeParse(formData.get("rewardItemId") || undefined);
  if (!tenantId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(tenantId.data, "manageRewards");
  const parsed = rewardItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    pointsCost: formData.get("pointsCost"),
    active: formData.get("active") === "on",
    imageDataUrl: formData.get("imageDataUrl") ?? "",
  });
  if (!parsed.success || !rewardItemId.success) {
    redirect(`/admin/${slug}/rewards?error=invalid`);
  }
  const input = parsed.data;

  const db = await getDb();
  await withTenant(db, tenantId.data, async (tx) => {
    let entityId = rewardItemId.data ?? null;
    if (entityId) {
      await tx
        .update(schema.rewardItems)
        .set({
          title: input.title,
          description: input.description || null,
          pointsCost: input.pointsCost,
          active: input.active,
          ...(input.imageDataUrl ? { imageUrl: input.imageDataUrl } : {}),
        })
        .where(eq(schema.rewardItems.id, entityId));
    } else {
      const [row] = await tx
        .insert(schema.rewardItems)
        .values({
          tenantId: tenantId.data,
          title: input.title,
          description: input.description || null,
          pointsCost: input.pointsCost,
          active: input.active,
          imageUrl: input.imageDataUrl || null,
        })
        .returning({ id: schema.rewardItems.id });
      entityId = row?.id ?? null;
    }
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: rewardItemId.data ? "reward_item.updated" : "reward_item.created",
      entity: "reward_item",
      entityId: entityId ?? undefined,
      meta: { title: input.title, pointsCost: input.pointsCost, active: input.active },
    });
  });
  redirect(`/admin/${slug}/rewards?saved=1`);
}

export async function redeemReward(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  const rewardId = z.uuid().safeParse(formData.get("rewardId"));
  const customerId = z.uuid().safeParse(formData.get("customerId"));
  if (!tenantId.success || !rewardId.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(
    tenantId.data,
    "redeemRewards",
  );

  const db = await getDb();
  await withTenant(db, tenantId.data, async (tx) => {
    const [updated] = await tx
      .update(schema.rewards)
      .set({ state: "redeemed", redeemedAt: new Date() })
      .where(
        and(eq(schema.rewards.id, rewardId.data), eq(schema.rewards.state, "earned")),
      )
      .returning();
    if (updated) {
      await audit(tx, {
        tenantId: tenantId.data,
        actorType: admin.kind,
        actorId: admin.subjectId,
        action: "reward.redeemed",
        entity: "reward",
        entityId: updated.id,
      });
    }
  });
  redirect(
    customerId.success
      ? `/admin/${slug}/customers/${customerId.data}`
      : `/admin/${slug}/customers`,
  );
}
