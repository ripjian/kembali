import "server-only";

import { cookies } from "next/headers";

import {
  ADMIN_SESSION_POLICY,
  CUSTOMER_SESSION_POLICY,
  cookieMaxAge,
  createSessionToken,
  evaluateSession,
  hashSessionToken,
  previousTokenCutoff,
  type SessionPolicy,
} from "@kembali/core";
import { schema, type KembaliDb } from "@kembali/db";
import { and, eq, isNotNull, lt, or, sql } from "drizzle-orm";

import { IS_PRODUCTION } from "./config";
import { DEMO_TENANT_ID, getDb } from "./db";

/* Session plumbing (SECURITY.md rule 6): random 256-bit tokens in
 * httpOnly/secure/lax cookies; only sha256 hashes are stored. Global auth
 * tables are readable by the app role without a tenant GUC - they hold no
 * tenant business data.
 *
 * The lifetime rules (absolute cap, idle cap, rotation interval, grace) are
 * pure and tested in `@kembali/core` session.ts. This file does the parts
 * that need a database and a cookie jar.
 *
 * Rotating a token means writing a new value to the cookie, and Next only
 * allows that in a Server Action or a Route Handler - never while a page is
 * rendering. So rotation is opt-in per call site (`allowRotation`), and the
 * rare misuse is caught rather than trusted: if the cookie write fails after
 * the row has already moved, the row is put back, because a session whose
 * cookie no longer matches is a person silently signed out. */

const CUSTOMER_COOKIE = "kb_session";
const ADMIN_COOKIE = "kb_admin";

type SessionKind = "customer" | "staff" | "platform";

/** Rotation needs a writable cookie jar, which exists in Server Actions and
 * Route Handlers but not during a render. Pages leave this off. */
export interface SessionReadOptions {
  allowRotation?: boolean;
}

function policyFor(kind: SessionKind): SessionPolicy {
  return kind === "customer" ? CUSTOMER_SESSION_POLICY : ADMIN_SESSION_POLICY;
}

async function createSession(
  db: KembaliDb,
  kind: SessionKind,
  subjectId: string,
  tenantId: string | null,
): Promise<{ token: string; maxAge: number }> {
  const { token, tokenHash } = createSessionToken();
  const policy = policyFor(kind);
  const now = new Date();
  await db.insert(schema.sessions).values({
    tokenHash,
    kind,
    subjectId,
    tenantId,
    expiresAt: new Date(now.getTime() + policy.absoluteSeconds * 1000),
    lastUsedAt: now,
    rotatedAt: now,
  });
  return { token, maxAge: cookieMaxAge({ createdAt: now }, policy, now) };
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

async function clearCookie(name: string) {
  try {
    const store = await cookies();
    store.delete(name);
  } catch {
    // Rendering a page: the row is already gone, so the cookie is inert and
    // the next writable request clears it.
  }
}

export async function startCustomerSession(
  db: KembaliDb,
  customerId: string,
  tenantId: string = DEMO_TENANT_ID,
) {
  const { token, maxAge } = await createSession(db, "customer", customerId, tenantId);
  await setCookie(CUSTOMER_COOKIE, token, maxAge);
}

export async function startAdminSession(
  db: KembaliDb,
  kind: "staff" | "platform",
  subjectId: string,
  tenantId: string | null,
) {
  const { token, maxAge } = await createSession(db, kind, subjectId, tenantId);
  await setCookie(ADMIN_COOKIE, token, maxAge);
}

type SessionRow = typeof schema.sessions.$inferSelect;

/**
 * Replace the token, keeping the session. The update is conditional on the
 * hash we read still being current, so two requests that both cross the
 * rotation boundary at once cannot both win and leave the browser holding a
 * value the database never kept.
 */
async function rotateToken(
  db: KembaliDb,
  cookieName: string,
  session: SessionRow,
  policy: SessionPolicy,
  now: Date,
): Promise<void> {
  const { token, tokenHash } = createSessionToken();
  const rotated = await db
    .update(schema.sessions)
    .set({
      tokenHash,
      previousTokenHash: session.tokenHash,
      previousValidUntil: new Date(now.getTime() + policy.graceSeconds * 1000),
      rotatedAt: now,
      lastUsedAt: now,
      // Unconfirmed until somebody presents it. Until then a browser still on
      // the old token is a lost reply, not a thief.
      tokenConfirmedAt: null,
    })
    .where(
      and(
        eq(schema.sessions.id, session.id),
        // Lost the race: another request rotated first and its token is the
        // one the browser now holds. Leave it alone.
        eq(schema.sessions.tokenHash, session.tokenHash),
      ),
    )
    .returning({ id: schema.sessions.id });
  if (rotated.length === 0) return;

  try {
    await setCookie(cookieName, token, cookieMaxAge(session, policy, now));
  } catch {
    // The cookie jar was read-only after all, so the browser still holds the
    // old value. Put the row back rather than sign the person out.
    await db
      .update(schema.sessions)
      .set({
        tokenHash: session.tokenHash,
        previousTokenHash: session.previousTokenHash,
        previousValidUntil: session.previousValidUntil,
        rotatedAt: session.rotatedAt,
        tokenConfirmedAt: session.tokenConfirmedAt,
        // lastUsedAt is deliberately left forward: this request was real
        // activity, whether or not the token moved.
      })
      .where(and(eq(schema.sessions.id, session.id), eq(schema.sessions.tokenHash, tokenHash)));
    console.warn("session rotation skipped: cookies are not writable in this context");
  }
}

async function readSession(
  cookieName: string,
  options: SessionReadOptions = {},
): Promise<SessionRow | null> {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  const presented = hashSessionToken(token);

  const db = await getDb();
  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(
      or(
        eq(schema.sessions.tokenHash, presented),
        eq(schema.sessions.previousTokenHash, presented),
      ),
    );
  if (!session) return null;

  const policy = policyFor(session.kind);
  const now = new Date();
  const presentedPrevious = session.tokenHash !== presented;
  const verdict = evaluateSession(
    {
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      rotatedAt: session.rotatedAt,
      presentedPrevious,
      previousValidUntil: session.previousValidUntil,
      tokenConfirmed: session.tokenConfirmedAt !== null,
    },
    policy,
    now,
  );

  // The absolute cap is also stored on the row so a cleanup job can find dead
  // sessions without knowing the policy; honour whichever fires first.
  if (verdict.status === "live" && session.expiresAt <= now) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, session.id));
    await clearCookie(cookieName);
    return null;
  }

  if (verdict.status !== "live") {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, session.id));
    await clearCookie(cookieName);
    if (verdict.status === "stolen") await recordReplay(db, session);
    return null;
  }

  if (verdict.rotate && options.allowRotation) {
    await rotateToken(db, cookieName, session, policy, now);
  } else if (verdict.touch || (!presentedPrevious && !session.tokenConfirmedAt)) {
    const staleCutoff = previousTokenCutoff(policy, now);
    await db
      .update(schema.sessions)
      .set({
        lastUsedAt: now,
        // First sighting of this token. Recorded even when the idle clock is
        // too fresh to be worth a write, because it is what a later replay is
        // judged against.
        tokenConfirmedAt: session.tokenConfirmedAt ?? (presentedPrevious ? null : now),
        // Drop a superseded hash once replaying it can no longer tell us
        // anything, so the table does not carry dead hashes indefinitely.
        previousTokenHash: sql`case when ${schema.sessions.previousValidUntil} < ${staleCutoff} then null else ${schema.sessions.previousTokenHash} end`,
        previousValidUntil: sql`case when ${schema.sessions.previousValidUntil} < ${staleCutoff} then null else ${schema.sessions.previousValidUntil} end`,
      })
      .where(eq(schema.sessions.id, session.id));
  }

  return session;
}

/**
 * A replayed token is the strongest security signal this system produces, and
 * SECURITY.md §6 gives 72 hours to say who was affected. `console.warn` alone
 * would not survive the week, so tenant-scoped sessions get an `audit_log`
 * row; a platform session has no tenant to file under and gets the log line.
 * Neither carries personal data (rule 10) - ids only.
 */
async function recordReplay(db: KembaliDb, session: SessionRow) {
  console.warn(`session revoked: replayed token (kind=${session.kind}, id=${session.id})`);
  if (!session.tenantId) return;
  try {
    const { withTenant } = await import("@kembali/db");
    await withTenant(db, session.tenantId, async (tx) => {
      await tx.insert(schema.auditLog).values({
        tenantId: session.tenantId!,
        actorType: session.kind,
        actorId: session.subjectId,
        action: "session.replayed_token_revoked",
        entity: "session",
        entityId: session.id,
        meta: { rotatedAt: session.rotatedAt.toISOString() },
      });
    });
  } catch (error) {
    // Revoking the session matters more than recording it. Never let a
    // logging failure turn a security response into a 500.
    console.error("failed to audit a replayed token", error);
  }
}

export async function getCustomerSession(options: SessionReadOptions = {}) {
  const session = await readSession(CUSTOMER_COOKIE, options);
  if (!session || session.kind !== "customer" || !session.tenantId) return null;
  return { customerId: session.subjectId, tenantId: session.tenantId };
}

/**
 * Give a browsing session its chance to rotate.
 *
 * Rotation needs a writable cookie jar, and most of both surfaces is page
 * renders: a shop owner reading reports and a customer glancing at their
 * stamps never submit anything. Without this the control would only fire for
 * people who happen to use a form, and the sessions that sit around longest
 * would be exactly the ones that never rotate. The signed-in layouts ping this
 * once on load, which puts every session back on the same clock.
 */
export async function keepSessionAlive() {
  const store = await cookies();
  for (const name of [CUSTOMER_COOKIE, ADMIN_COOKIE]) {
    if (store.get(name)) await readSession(name, { allowRotation: true });
  }
}

/** Delete sessions whose absolute cap has passed. Opportunistic, called from
 * the sign-in paths; a scheduled job replaces this when one exists. */
export async function pruneExpiredSessions(db: KembaliDb) {
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  // Superseded hashes on sessions that stopped rotating age out here too.
  // Each kind gets its own reuse window: a staff hash kept to the customer
  // window would sit on file for twice as long as the policy says.
  const now = new Date();
  for (const [kind, policy] of [
    ["customer", CUSTOMER_SESSION_POLICY],
    ["staff", ADMIN_SESSION_POLICY],
    ["platform", ADMIN_SESSION_POLICY],
  ] as const) {
    await db
      .update(schema.sessions)
      .set({ previousTokenHash: null, previousValidUntil: null })
      .where(
        and(
          eq(schema.sessions.kind, kind),
          isNotNull(schema.sessions.previousTokenHash),
          lt(schema.sessions.previousValidUntil, previousTokenCutoff(policy, now)),
        ),
      );
  }
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

export async function getAdminContext(
  options: SessionReadOptions = {},
): Promise<AdminContext | null> {
  const session = await readSession(ADMIN_COOKIE, options);
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
      // Match the superseded hash too: signing out moments after a rotation
      // must still end the session, not leave an orphan row behind.
      const presented = hashSessionToken(token);
      await db
        .delete(schema.sessions)
        .where(
          or(
            eq(schema.sessions.tokenHash, presented),
            eq(schema.sessions.previousTokenHash, presented),
          ),
        );
      store.delete(name);
    }
  }
}
