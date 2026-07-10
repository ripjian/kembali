import "server-only";

import { headers } from "next/headers";

import { schema, withPlatform } from "@kembali/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { DEMO_TENANT_ID, getDb } from "./db";

/* Tenant resolution for the public customer join flow. A merchant's printed
 * QR encodes /app/join/{slug}; the slug alone decides which tenant's card a
 * new customer joins, independent of any existing session. */

export interface PublicTenant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandPrimary: string | null;
  brandAccent: string | null;
}

/** Public branding for a tenant by slug. Uses the platform bypass but only
 * selects non-sensitive, already-public branding fields for the one slug. */
export async function getPublicTenantBySlug(
  slug: string,
): Promise<PublicTenant | null> {
  const db = await getDb();
  return withPlatform(db, async (tx) => {
    const [t] = await tx
      .select({
        id: schema.tenants.id,
        name: schema.tenants.name,
        slug: schema.tenants.slug,
        logoUrl: schema.tenants.logoUrl,
        brandPrimary: schema.tenants.brandPrimary,
        brandAccent: schema.tenants.brandAccent,
      })
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, slug));
    return t ?? null;
  });
}

/** Resolve a client-supplied tenant id for OTP: use it only if it is a real
 * tenant, else fall back to the demo tenant. Never trusts the raw input for a
 * FK insert. */
export async function resolveJoinTenantId(
  rawTenantId: unknown,
): Promise<string> {
  const parsed = z.uuid().safeParse(rawTenantId);
  if (!parsed.success) return DEMO_TENANT_ID;
  const db = await getDb();
  const exists = await withPlatform(db, async (tx) => {
    const [t] = await tx
      .select({ id: schema.tenants.id })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, parsed.data));
    return Boolean(t);
  });
  return exists ? parsed.data : DEMO_TENANT_ID;
}

/** Absolute origin of the current request (for building the printed QR URL).
 * Honours a forwarded proto/host behind a proxy; falls back to localhost. */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
