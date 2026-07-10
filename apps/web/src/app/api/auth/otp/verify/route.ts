import { NextResponse } from "next/server";

import {
  hashOtpCode,
  isOtpBypass,
  needsRegistration,
  OTP_MAX_ATTEMPTS,
} from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { startCustomerSession } from "@/lib/auth";
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
    return NextResponse.json(
      { error: "That code didn't match. Check it or request a new one." },
      { status: 400 },
    );
  }

  await startCustomerSession(db, result.customerId, tenantId);
  return NextResponse.json({ ok: true, needsProfile: result.needsProfile });
}
