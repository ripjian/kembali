import "server-only";

import { cookies } from "next/headers";

import { createSessionToken, hashSessionToken } from "@kembali/core";
import { schema, type KembaliDb } from "@kembali/db";
import { eq } from "drizzle-orm";

import {
  ADMIN_SESSION_TTL_HOURS,
  CUSTOMER_SESSION_TTL_DAYS,
  IS_PRODUCTION,
} from "./config";
import { DEMO_TENANT_ID, getDb } from "./db";

/* Session plumbing (SECURITY.md rule 6): random 256-bit tokens in
 * httpOnly/secure/lax cookies; only sha256 hashes are stored. Global auth
 * tables are readable by the app role without a tenant GUC — they hold no
 * tenant business data. */

const CUSTOMER_COOKIE = "kb_session";
const ADMIN_COOKIE = "kb_admin";

type SessionKind = "customer" | "staff" | "platform";

async function createSession(
  db: KembaliDb,
  kind: SessionKind,
  subjectId: string,
  tenantId: string | null,
): Promise<string> {
  const { token, tokenHash } = createSessionToken();
  const ttlMs =
    kind === "customer"
      ? CUSTOMER_SESSION_TTL_DAYS * 24 * 3600_000
      : ADMIN_SESSION_TTL_HOURS * 3600_000;
  await db.insert(schema.sessions).values({
    tokenHash,
    kind,
    subjectId,
    tenantId,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

async function setCookie(name: string, value: string, maxAgeSeconds: number) {
  const store = await cookies();
  store.set(name, value, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function startCustomerSession(db: KembaliDb, customerId: string) {
  const token = await createSession(db, "customer", customerId, DEMO_TENANT_ID);
  await setCookie(CUSTOMER_COOKIE, token, CUSTOMER_SESSION_TTL_DAYS * 86400);
}

export async function startAdminSession(
  db: KembaliDb,
  kind: "staff" | "platform",
  subjectId: string,
  tenantId: string | null,
) {
  const token = await createSession(db, kind, subjectId, tenantId);
  await setCookie(ADMIN_COOKIE, token, ADMIN_SESSION_TTL_HOURS * 3600);
}

async function readSession(cookieName: string) {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  const db = await getDb();
  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.tokenHash, hashSessionToken(token)));
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, session.id));
    return null;
  }
  return session;
}

export async function getCustomerSession() {
  const session = await readSession(CUSTOMER_COOKIE);
  if (!session || session.kind !== "customer" || !session.tenantId) return null;
  return { customerId: session.subjectId, tenantId: session.tenantId };
}

export interface AdminContext {
  kind: "staff" | "platform";
  subjectId: string;
  /** The staff member's own tenant; null for platform admins (their
   * working tenant comes from the /admin/[slug] path). */
  tenantId: string | null;
  name: string;
  email: string;
  role: "owner" | "manager" | "cashier" | "platform";
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const session = await readSession(ADMIN_COOKIE);
  if (!session || session.kind === "customer") return null;
  const db = await getDb();

  if (session.kind === "platform") {
    const [admin] = await db
      .select()
      .from(schema.platformAdmins)
      .where(eq(schema.platformAdmins.id, session.subjectId));
    if (!admin) return null;
    return {
      kind: "platform",
      subjectId: admin.id,
      tenantId: null,
      name: admin.name,
      email: admin.email,
      role: "platform",
    };
  }

  if (!session.tenantId) return null;
  const { withTenant } = await import("@kembali/db");
  const staff = await withTenant(db, session.tenantId, async (tx) => {
    const [row] = await tx
      .select()
      .from(schema.staffUsers)
      .where(eq(schema.staffUsers.id, session.subjectId));
    return row ?? null;
  });
  if (!staff) return null;
  return {
    kind: "staff",
    subjectId: staff.id,
    tenantId: session.tenantId,
    name: staff.name,
    email: staff.email,
    role: staff.role,
  };
}

export async function destroySessions() {
  const store = await cookies();
  const db = await getDb();
  for (const name of [CUSTOMER_COOKIE, ADMIN_COOKIE]) {
    const token = store.get(name)?.value;
    if (token) {
      await db
        .delete(schema.sessions)
        .where(eq(schema.sessions.tokenHash, hashSessionToken(token)));
      store.delete(name);
    }
  }
}
