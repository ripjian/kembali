import { NextResponse } from "next/server";

import {
  checkStampVelocity,
  computeCardProgress,
  earnsReward,
  verifyQrToken,
} from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";

import { getAdminContext } from "@/lib/auth";
import { qrTokenSecret } from "@/lib/config";
import { getDb } from "@/lib/db";

const bodySchema = z.object({
  /** Signed QR token (camera/paste) — or a cardId for manual stamping. */
  qrToken: z.string().optional(),
  cardId: z.uuid().optional(),
  amountCents: z.number().int().min(0).max(5_000_00).optional(),
});

const rewardRules = z.object({ rewardValidDays: z.number().int().positive().optional() });
const rewardDefs = z.array(z.object({ type: z.string(), title: z.string().optional() }));

export async function POST(req: Request) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Sign in to stamp cards." }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.qrToken && !parsed.data.cardId)) {
    return NextResponse.json(
      { error: "Scan a code or choose a card first." },
      { status: 400 },
    );
  }

  let cardId = parsed.data.cardId ?? null;
  let source: "qr" | "manual" = "manual";
  if (parsed.data.qrToken) {
    const verified = verifyQrToken(parsed.data.qrToken, qrTokenSecret());
    if (!verified.ok) {
      const message =
        verified.reason === "expired"
          ? "That code has expired. Ask the customer to refresh their card."
          : "That code isn't valid. Scan the card again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (verified.payload.tenantId !== admin.tenantId) {
      return NextResponse.json(
        { error: "That card belongs to a different store." },
        { status: 403 },
      );
    }
    cardId = verified.payload.cardId;
    source = "qr";
  }
  if (!cardId) {
    return NextResponse.json({ error: "Scan a code or choose a card first." }, { status: 400 });
  }
  const resolvedCardId = cardId;

  const db = await getDb();
  const result = await withTenant(db, admin.tenantId, async (tx) => {
    const [card] = await tx
      .select()
      .from(schema.cards)
      .where(eq(schema.cards.id, resolvedCardId));
    if (!card) return { error: "Card not found for this store." as string };

    const [program] = await tx
      .select()
      .from(schema.programs)
      .where(eq(schema.programs.id, card.programId));
    const [customer] = await tx
      .select({ name: schema.customers.name, phone: schema.customers.phone })
      .from(schema.customers)
      .where(eq(schema.customers.id, card.customerId));
    if (!program || !customer) return { error: "Card not found for this store." };

    // Velocity rules v1 (SECURITY.md rule 5)
    const recent = await tx
      .select({ createdAt: schema.stampEvents.createdAt })
      .from(schema.stampEvents)
      .where(
        and(
          eq(schema.stampEvents.cardId, card.id),
          gt(schema.stampEvents.createdAt, new Date(Date.now() - 86_400_000)),
        ),
      );
    const velocity = checkStampVelocity(recent.map((r) => r.createdAt));
    if (!velocity.allowed) {
      return {
        error:
          velocity.reason === "too_soon"
            ? "This card was stamped less than a minute ago."
            : "This card reached today's stamp limit.",
      };
    }

    const [outlet] = await tx
      .select({ id: schema.outlets.id })
      .from(schema.outlets)
      .limit(1);
    if (!outlet) return { error: "This store has no outlet configured yet." };

    await tx.insert(schema.stampEvents).values({
      tenantId: admin.tenantId,
      cardId: card.id,
      outletId: outlet.id,
      staffId: admin.kind === "staff" ? admin.subjectId : null,
      source,
      amountCents: parsed.data.amountCents ?? null,
    });

    const newCount = card.stampsCount + 1;
    await tx
      .update(schema.cards)
      .set({ stampsCount: sql`${schema.cards.stampsCount} + 1` })
      .where(eq(schema.cards.id, card.id));

    let rewardEarned = false;
    if (earnsReward(newCount, program.stampsRequired)) {
      rewardEarned = true;
      const defs = rewardDefs.safeParse(program.rewardDefinitions);
      const rules = rewardRules.safeParse(program.expiryRules);
      const validDays = rules.success ? (rules.data.rewardValidDays ?? 30) : 30;
      await tx.insert(schema.rewards).values({
        tenantId: admin.tenantId,
        cardId: card.id,
        type: defs.success && defs.data[0] ? defs.data[0].type : "reward",
        expiresAt: new Date(Date.now() + validDays * 86_400_000),
      });
    }

    const progress = computeCardProgress({
      stampsCount: newCount,
      stampsRequired: program.stampsRequired,
    });
    return {
      customerName: customer.name ?? customer.phone ?? "Customer",
      stampsCount: newCount,
      stampsRequired: program.stampsRequired,
      stampsRemaining: progress.stampsRemaining,
      rewardEarned,
    };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json(result);
}
