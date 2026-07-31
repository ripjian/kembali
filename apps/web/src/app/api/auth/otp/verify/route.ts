import { NextResponse } from "next/server";

import {
  formatRetryAfter,
  hashOtpCode,
  isOtpBypass,
  needsRegistration,
  OTP_MAX_ATTEMPTS,
  OTP_VERIFY_DEVICE_POLICY,
  OTP_VERIFY_IP_POLICY,
  OTP_VERIFY_PAIR_POLICY,
} from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { startCustomerSession } from "@/lib/auth";
import {
  clearAuthFailures,
  clientAddressKey,
  consumeAuthAttempt,
  deviceKey,
  logLockout,
  pruneAuthAttempts,
} from "@/lib/auth-throttle";
import { OTP_BYPASS_ENABLED } from "@/lib/config";
import { getDb } from "@/lib/db";
import { resolveJoinTenantId } from "@/lib/join";
import { normalizePhone, phoneInputSchema } from "@/lib/phone";

const bodySchema = z.object({
  phone: phoneInputSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  // The tenant whose join page issued the code (tenant-scoped join).
  tenantId: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your phone number and the 6-digit code." },
      { status: 400 },
    );
  }
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Phone number looks incomplete." }, { status: 400 });
  }
  const { code } = parsed.data;
  const db = await getDb();

  // The per-code attempt cap stops one code being brute-forced; these stop a
  // host cycling codes across phones (SECURITY.md rule 6). Recorded before
  // the decision so a parallel burst cannot walk through the cap.
  const address = await clientAddressKey();
  const device = await deviceKey();
  const keys = { identifier: phone, addressKey: address, deviceKey: device };
  const throttle = await consumeAuthAttempt(db, {
    kind: "otp_verify",
    identifier: phone,
    addressKey: address,
    deviceKey: device,
    pairPolicy: OTP_VERIFY_PAIR_POLICY,
    identityPolicy: OTP_VERIFY_PAIR_POLICY,
    ipPolicy: OTP_VERIFY_IP_POLICY,
    devicePairPolicy: OTP_VERIFY_DEVICE_POLICY,
    devicePolicy: OTP_VERIFY_DEVICE_POLICY,
  });
  if (throttle.locked) {
    logLockout("otp_verify", throttle, keys);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${formatRetryAfter(throttle.retryAfterSeconds)}.` },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } },
    );
  }

  const tenantId = await resolveJoinTenantId(parsed.data.tenantId);

  const result = await withTenant(db, tenantId, async (tx) => {
    if (!isOtpBypass(code, OTP_BYPASS_ENABLED)) {
      const [otp] = await tx
        .select()
        .from(schema.otpCodes)
        .where(
          and(
            eq(schema.otpCodes.phone, phone),
            isNull(schema.otpCodes.consumedAt),
            gt(schema.otpCodes.expiresAt, new Date()),
          ),
        )
        .orderBy(desc(schema.otpCodes.createdAt))
        .limit(1);
      if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false as const };
      if (otp.codeHash !== hashOtpCode(phone, code)) {
        await tx
          .update(schema.otpCodes)
          .set({ attempts: sql`${schema.otpCodes.attempts} + 1` })
          .where(eq(schema.otpCodes.id, otp.id));
        return { ok: false as const };
      }
      await tx
        .update(schema.otpCodes)
        .set({ consumedAt: new Date() })
        .where(eq(schema.otpCodes.id, otp.id));
    }

    // First verified phone for this tenant = a new phone-only customer; the
    // registration screen fills in the rest.
    let [customer] = await tx
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.phone, phone));
    if (!customer) {
      [customer] = await tx
        .insert(schema.customers)
        .values({ tenantId, phone })
        .returning();
    }
    if (!customer) return { ok: false as const };

    // Ensure a card on the tenant's first active program.
    const [card] = await tx
      .select({ id: schema.cards.id })
      .from(schema.cards)
      .where(eq(schema.cards.customerId, customer.id));
    if (!card) {
      const [program] = await tx
        .select()
        .from(schema.programs)
        .where(eq(schema.programs.active, true))
        .orderBy(asc(schema.programs.createdAt))
        .limit(1);
      if (program) {
        await tx.insert(schema.cards).values({
          tenantId,
          customerId: customer.id,
          programId: program.id,
        });
      }
    }
    return {
      ok: true as const,
      customerId: customer.id,
      // A nameless customer (new, or an old phone-only record) still needs
      // the one-screen registration before their card.
      needsProfile: needsRegistration(customer),
    };
  });

  if (!result.ok) {
    // The attempt is already recorded; just keep the table tidy.
    await pruneAuthAttempts(db, "otp_verify", [
      OTP_VERIFY_PAIR_POLICY,
      OTP_VERIFY_IP_POLICY,
      OTP_VERIFY_DEVICE_POLICY,
    ]);
    return NextResponse.json(
      { error: "That code didn't match. Check it or request a new one." },
      { status: 400 },
    );
  }

  // A correct code clears this phone's failures from this address.
  await clearAuthFailures(db, { kind: "otp_verify", ...keys });
  await startCustomerSession(db, result.customerId, tenantId);
  return NextResponse.json({ ok: true, needsProfile: result.needsProfile });
}
