import { NextResponse } from "next/server";

import {
  generateOtpCode,
  hashOtpCode,
  OTP_DEV_BYPASS_CODE,
  OTP_TTL_MINUTES,
} from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";

import { IS_PRODUCTION, OTP_BYPASS_ENABLED } from "@/lib/config";
import { DEMO_TENANT_ID, getDb } from "@/lib/db";
import { normalizePhone, phoneInputSchema } from "@/lib/phone";

const bodySchema = z.object({ phone: phoneInputSchema });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  const phone = parsed.success ? normalizePhone(parsed.data.phone) : null;
  if (!phone) {
    return NextResponse.json(
      { error: "Phone number looks incomplete. Check it and try again." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const code = generateOtpCode();

  const limited = await withTenant(db, DEMO_TENANT_ID, async (tx) => {
    // OTP rate limit (SECURITY.md rule 6): max 3 live codes per phone.
    const live = await tx
      .select({ id: schema.otpCodes.id })
      .from(schema.otpCodes)
      .where(
        and(
          eq(schema.otpCodes.phone, phone),
          isNull(schema.otpCodes.consumedAt),
          gt(schema.otpCodes.expiresAt, new Date()),
        ),
      );
    if (live.length >= 3) return true;
    await tx.insert(schema.otpCodes).values({
      tenantId: DEMO_TENANT_ID,
      phone,
      codeHash: hashOtpCode(phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    });
    return false;
  });

  if (limited) {
    return NextResponse.json(
      { error: "Too many codes requested. Wait a few minutes and try again." },
      { status: 429 },
    );
  }

  // Phase 1 remaining: real SMS/WhatsApp delivery. Dev: print the code
  // (code only - never the phone number; SECURITY.md rule 10).
  if (!IS_PRODUCTION) {
    console.log(`[dev] OTP code: ${code} (bypass ${OTP_DEV_BYPASS_CODE} also works)`);
  }

  return NextResponse.json({ sent: true, devBypass: OTP_BYPASS_ENABLED });
}
