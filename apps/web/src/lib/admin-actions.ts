"use server";

import { redirect } from "next/navigation";

import { hashPassword, verifyPassword } from "@kembali/core";
import { schema, withPlatform, withTenant, type KembaliDb } from "@kembali/db";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  destroySessions,
  getAdminContext,
  setActiveTenant,
  startAdminSession,
} from "./auth";
import { getDb } from "./db";
import { modulesSchema } from "./modules";
import { normalizePhone } from "./phone";

/* Server actions for the admin panel. Every privileged/platform action
 * writes to audit_log (SECURITY.md rule 9). Errors surface via redirect
 * query params — plain-HTML friendly, no client JS required. */

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

  // Platform admin first, then merchant staff (global lookup by email).
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

/* ---- merchant actions -------------------------------------------------- */

const newCustomerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().min(8),
  email: z.union([z.email(), z.literal("")]),
  birthday: z.union([z.iso.date(), z.literal("")]),
  optInWhatsapp: z.boolean(),
  optInEmail: z.boolean(),
});

export async function createCustomer(formData: FormData) {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");
  const parsed = newCustomerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    birthday: formData.get("birthday") ?? "",
    optInWhatsapp: formData.get("optInWhatsapp") === "on",
    optInEmail: formData.get("optInEmail") === "on",
  });
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!parsed.success || !phone) redirect("/admin/customers/new?error=invalid");
  const input = parsed.data;

  const db = await getDb();
  const customerId = await withTenant(db, admin.tenantId, async (tx) => {
    const [existing] = await tx
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.phone, phone));
    if (existing) return null;
    const [customer] = await tx
      .insert(schema.customers)
      .values({
        tenantId: admin.tenantId,
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
        tenantId: admin.tenantId,
        customerId: customer.id,
        programId: program.id,
      });
    }
    return customer.id;
  });

  if (!customerId) redirect("/admin/customers/new?error=exists");
  redirect(`/admin/customers/${customerId}`);
}

export async function redeemReward(formData: FormData) {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");
  const rewardId = z.uuid().safeParse(formData.get("rewardId"));
  const customerId = z.uuid().safeParse(formData.get("customerId"));
  if (!rewardId.success) redirect("/admin/customers");

  const db = await getDb();
  await withTenant(db, admin.tenantId, async (tx) => {
    const [updated] = await tx
      .update(schema.rewards)
      .set({ state: "redeemed", redeemedAt: new Date() })
      .where(
        and(eq(schema.rewards.id, rewardId.data), eq(schema.rewards.state, "earned")),
      )
      .returning();
    if (updated) {
      await audit(tx, {
        tenantId: admin.tenantId,
        actorType: admin.kind,
        actorId: admin.subjectId,
        action: "reward.redeemed",
        entity: "reward",
        entityId: updated.id,
      });
    }
  });
  redirect(customerId.success ? `/admin/customers/${customerId.data}` : "/admin/customers");
}

/* ---- platform actions --------------------------------------------------- */

async function requirePlatform() {
  const admin = await getAdminContext();
  if (!admin || admin.kind !== "platform") redirect("/admin");
  return admin;
}

const newTenantSchema = z.object({
  name: z.string().trim().min(2).max(80),
  outletName: z.string().trim().min(2).max(120),
  ownerName: z.string().trim().min(2).max(120),
  ownerEmail: z.email(),
  ownerPassword: z.string().min(8, "Password needs at least 8 characters"),
  stampsRequired: z.coerce.number().int().min(2).max(30),
  rewardTitle: z.string().trim().min(2).max(120),
});

export async function createTenant(formData: FormData) {
  const admin = await requirePlatform();
  const parsed = newTenantSchema.safeParse({
    name: formData.get("name"),
    outletName: formData.get("outletName"),
    ownerName: formData.get("ownerName"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPassword: formData.get("ownerPassword"),
    stampsRequired: formData.get("stampsRequired") ?? 10,
    rewardTitle: formData.get("rewardTitle"),
  });
  if (!parsed.success) redirect("/admin/merchants?error=invalid");
  const input = parsed.data;
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const db = await getDb();
  const tenantId = await withPlatform(db, async (tx) => {
    const [tenant] = await tx
      .insert(schema.tenants)
      .values({ name: input.name, slug })
      .onConflictDoNothing()
      .returning();
    if (!tenant) return null;
    await tx.insert(schema.staffUsers).values({
      tenantId: tenant.id,
      email: input.ownerEmail,
      name: input.ownerName,
      role: "owner",
      passwordHash: hashPassword(input.ownerPassword),
    });
    await audit(tx, {
      tenantId: tenant.id,
      actorType: "platform",
      actorId: admin.subjectId,
      action: "tenant.created",
      entity: "tenant",
      entityId: tenant.id,
      meta: { slug },
    });
    return tenant.id;
  });
  if (!tenantId) redirect("/admin/merchants?error=exists");

  // Outlet + default program are tenant-scoped inserts.
  await withTenant(db, tenantId, async (tx) => {
    await tx.insert(schema.outlets).values({ tenantId, name: input.outletName });
    await tx.insert(schema.programs).values({
      tenantId,
      name: "Loyalty card",
      stampsRequired: input.stampsRequired,
      rewardDefinitions: [{ type: "reward", title: input.rewardTitle }],
      expiryRules: { rewardValidDays: 30 },
    });
  });
  redirect("/admin/merchants?created=1");
}

export async function switchTenant(formData: FormData) {
  await requirePlatform();
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  if (tenantId.success) await setActiveTenant(tenantId.data);
  redirect("/admin");
}

export async function setStaffRole(formData: FormData) {
  const admin = await getAdminContext();
  if (!admin || (admin.kind !== "platform" && admin.role !== "owner")) {
    redirect("/admin");
  }
  const staffId = z.uuid().safeParse(formData.get("staffId"));
  const role = z.enum(["owner", "manager", "cashier"]).safeParse(formData.get("role"));
  if (!staffId.success || !role.success) redirect("/admin/team?error=invalid");

  const db = await getDb();
  await withTenant(db, admin.tenantId, async (tx) => {
    await tx
      .update(schema.staffUsers)
      .set({ role: role.data })
      .where(eq(schema.staffUsers.id, staffId.data));
    await audit(tx, {
      tenantId: admin.tenantId,
      actorType: admin.kind,
      actorId: admin.subjectId,
      action: "staff.role_changed",
      entity: "staff_user",
      entityId: staffId.data,
      meta: { role: role.data },
    });
  });
  redirect("/admin/team");
}

export async function resetStaffPassword(formData: FormData) {
  const admin = await requirePlatform();
  const staffId = z.uuid().safeParse(formData.get("staffId"));
  const password = z.string().min(8).safeParse(formData.get("password"));
  if (!staffId.success || !password.success) redirect("/admin/team?error=password");

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
  redirect("/admin/team?reset=1");
}

export async function saveModules(formData: FormData) {
  const admin = await requirePlatform();
  const tenantId = z.uuid().safeParse(formData.get("tenantId"));
  if (!tenantId.success) redirect("/admin/modules");
  const modules = modulesSchema.parse({
    stamps: formData.get("stamps") === "on",
    scan: formData.get("scan") === "on",
    reports: formData.get("reports") === "on",
  });

  const db = await getDb();
  await withPlatform(db, async (tx) => {
    await tx
      .update(schema.tenants)
      .set({ modules })
      .where(eq(schema.tenants.id, tenantId.data));
    await audit(tx, {
      tenantId: tenantId.data,
      actorType: "platform",
      actorId: admin.subjectId,
      action: "tenant.modules_changed",
      entity: "tenant",
      entityId: tenantId.data,
      meta: modules,
    });
  });
  redirect("/admin/modules?saved=1");
}
