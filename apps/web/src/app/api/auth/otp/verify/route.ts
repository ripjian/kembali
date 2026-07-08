import { NextResponse } from "next/server";

import { hashOtpCode, isOtpBypass, OTP_MAX_ATTEMPTS } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { startCustomerSession } from "@/lib/auth";
import { OTP_BYPASS_ENABLED } from "@/lib/config";
import { DEMO_TENANT_ID, getDb } from "@/lib/db";
import { normalizePhone, phoneInputSchema } from "@/lib/phone";

const bodySchema = z.object({
  phone: phoneInputSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
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

  const result = await withTenant(db, DEMO_TENANT_ID, async (tx) => {
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

    // Login doubles as registration: first verified phone = new customer.
    let isNew = false;
    let [customer] = await tx
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.phone, phone));
    if (!customer) {
      isNew = true;
      [customer] = await tx
        .insert(schema.customers)
        .values({ tenantId: DEMO_TENANT_ID, phone })
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
          tenantId: DEMO_TENANT_ID,
          customerId: customer.id,
          programId: program.id,
        });
      }
    }
    return { ok: true as const, customerId: customer.id, isNew };
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "That code didn't match. Check it or request a new one." },
      { status: 400 },
    );
  }

  await startCustomerSession(db, result.customerId);
  return NextResponse.json({ ok: true, isNew: result.isNew });
}
