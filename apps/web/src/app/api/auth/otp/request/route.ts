import { NextResponse } from "next/server";

import {
  formatRetryAfter,
  generateOtpCode,
  hashOtpCode,
  OTP_DEV_BYPASS_CODE,
  OTP_REQUEST_DEVICE_POLICY,
  OTP_REQUEST_IP_POLICY,
  OTP_REQUEST_PHONE_POLICY,
  OTP_TTL_MINUTES,
} from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";

import {
  clientAddressKey,
  consumeAuthAttempt,
  deviceKey,
  logLockout,
  pruneAuthAttempts,
} from "@/lib/auth-throttle";
import { getDb } from "@/lib/db";
import { resolveJoinTenantId } from "@/lib/join";
import { getOtpSender, OTP_DEV_NOTICE } from "@/lib/otp-sender";
import { normalizePhone, phoneInputSchema } from "@/lib/phone";

const bodySchema = z.object({
  phone: phoneInputSchema,
  // Set by the tenant-scoped join page so the customer is created under the
  // right merchant; omitted on the demo login (falls back to the demo tenant).
  tenantId: z.string().optional(),
});

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

  // Send caps (SECURITY.md rule 6). Every send is charged, delivered or not:
  // the limit is on volume, because each message costs money and sender
  // reputation. Recording before deciding is what holds the cap against a
  // parallel burst; the failures are never cleared on this path for the same
  // reason. The per-phone limit does the abuse work, so the per-address cap
  // can stay high enough for a real counter queue on shop wifi.
  const address = await clientAddressKey();
  const device = await deviceKey();
  const keys = { identifier: phone, addressKey: address, deviceKey: device };
  const throttle = await consumeAuthAttempt(db, {
    kind: "otp_request",
    identifier: phone,
    addressKey: address,
    deviceKey: device,
    pairPolicy: OTP_REQUEST_PHONE_POLICY,
    identityPolicy: OTP_REQUEST_PHONE_POLICY,
    ipPolicy: OTP_REQUEST_IP_POLICY,
    devicePairPolicy: OTP_REQUEST_DEVICE_POLICY,
    devicePolicy: OTP_REQUEST_DEVICE_POLICY,
  });
  if (throttle.locked) {
    logLockout("otp_request", throttle, keys);
    return NextResponse.json(
      { error: `Too many codes requested. Try again in ${formatRetryAfter(throttle.retryAfterSeconds)}.` },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } },
    );
  }

  const code = generateOtpCode();
  const tenantId = await resolveJoinTenantId(
    parsed.success ? parsed.data.tenantId : undefined,
  );

  const limited = await withTenant(db, tenantId, async (tx) => {
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
      tenantId,
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

  // Deliver via the configured provider. NullSender (no provider yet) sends
  // nothing; a real WhatsApp/SMS sender slots in here with no route changes.
  await getOtpSender().send(phone, code);

  await pruneAuthAttempts(db, "otp_request", [
    OTP_REQUEST_PHONE_POLICY,
    OTP_REQUEST_IP_POLICY,
    OTP_REQUEST_DEVICE_POLICY,
  ]);

  // With no provider connected (dev only), print the code so it can still be
  // used (code only - never the phone number; SECURITY.md rule 10).
  if (OTP_DEV_NOTICE) {
    console.log(`[dev] OTP code: ${code} (no provider connected; ${OTP_DEV_BYPASS_CODE} also works)`);
  }

  return NextResponse.json({ sent: true, devNotice: OTP_DEV_NOTICE });
}
