"use server";

import { redirect } from "next/navigation";

import {
  hashPassword,
  verifyPassword,
  PERMISSION_KEYS,
  type RolePermissionMatrix,
} from "@kembali/core";
import { schema, withPlatform, withTenant, type KembaliDb } from "@kembali/db";
import { and, asc, eq } from "drizzle-orm";
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

export async function setStaffRole(formData: FormData) {
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  const staffId = z.uuid().safeParse(formData.get("staffId"));
  const role = z.enum(["owner", "manager", "cashier"]).safeParse(formData.get("role"));
  if (!tenantId.success || !staffId.success || !role.success) redirect("/admin");
  const { admin, slug } = await authorizeTenantAction(tenantId.data, "manageTeam");

  const db = await getDb();
  await withTenant(db, tenantId.data, async (tx) => {
    await tx
      .update(schema.staffUsers)
      .set({ role: role.data })
      .where(eq(schema.staffUsers.id, staffId.data));
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "staff.role_changed",
      entity: "staff_user",
      entityId: staffId.data,
      meta: { role: role.data },
    });
  });
  redirect(`/admin/${slug}/team`);
}

export async function resetStaffPassword(formData: FormData) {
  const admin = await requirePlatform();
  const staffId = z.uuid().safeParse(formData.get("staffId"));
  const password = z.string().min(8).safeParse(formData.get("password"));
  const slug = z.string().min(1).safeParse(formData.get("slug"));
  if (!staffId.success || !password.success || !slug.success) {
    redirect("/admin/merchants");
  }

  const db = await getDb();
  await withPlatform(db, async (tx) => {
    const [staff] = await tx
      .update(schema.staffUsers)
      .set({ passwordHash: hashPassword(password.data) })
      .where(eq(schema.staffUsers.id, staffId.data))
      .returning();
    if (staff) {
      await audit(tx, {
        tenantId: staff.tenantId,
        actorType: "platform",
        actorId: admin.subjectId,
        action: "staff.password_reset",
        entity: "staff_user",
        entityId: staff.id,
      });
    }
  });
  redirect(`/admin/${slug.data}/team?reset=1`);
}

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
