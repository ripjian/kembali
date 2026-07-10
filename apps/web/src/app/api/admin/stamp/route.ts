import { NextResponse } from "next/server";

import {
  checkStampVelocity,
  computeCardProgress,
  earnsReward,
  pointsForAmount,
  resolveRolePermissions,
  verifyQrToken,
} from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";

import { getAdminContext } from "@/lib/auth";
import { qrTokenSecret } from "@/lib/config";
import { getDb } from "@/lib/db";
import { parseModules } from "@/lib/modules";
import { resolveEventOutletId } from "@/lib/serving-outlet";

const bodySchema = z.object({
  /** Signed QR token from the customer's card (camera or paste). */
  qrToken: z.string(),
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Scan a code first." }, { status: 400 });
  }

  const verified = verifyQrToken(parsed.data.qrToken, qrTokenSecret());
  if (!verified.ok) {
    const message =
      verified.reason === "expired"
        ? "That code has expired. Ask the customer to refresh their card."
        : "That code isn't valid. Scan the card again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  // The token names the store; staff may only stamp for their own store,
  // platform admins for any.
  if (admin.kind === "staff" && verified.payload.tenantId !== admin.tenantId) {
    return NextResponse.json(
      { error: "That card belongs to a different store." },
      { status: 403 },
    );
  }
  const tenantId = verified.payload.tenantId;
  const resolvedCardId = verified.payload.cardId;
  const source = "qr" as const;

  const db = await getDb();
  const result = await withTenant(db, tenantId, async (tx) => {
    const [tenantRow] = await tx
      .select({
        rolePermissions: schema.tenants.rolePermissions,
        pointsPerRm: schema.tenants.pointsPerRm,
        modules: schema.tenants.modules,
      })
      .from(schema.tenants);
    if (admin.kind === "staff") {
      const matrix = resolveRolePermissions(tenantRow?.rolePermissions);
      const role = admin.role as "owner" | "manager" | "cashier";
      if (!matrix[role].scan) {
        return { error: "Your role can't stamp cards. Ask the owner." };
      }
    }

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

    // Attribute to the cashier's serving outlet of the day (falls back to
    // the tenant's first outlet). ROADMAP §? / Decision Log 2026-07-11.
    const servingOutletId = await resolveEventOutletId(tx, tenantId);
    if (!servingOutletId) return { error: "This store has no outlet configured yet." };

    const [stampEvent] = await tx
      .insert(schema.stampEvents)
      .values({
        tenantId,
        cardId: card.id,
        outletId: servingOutletId,
        staffId: admin.kind === "staff" ? admin.subjectId : null,
        source,
        amountCents: parsed.data.amountCents ?? null,
      })
      .returning({ id: schema.stampEvents.id });

    // Points accrue from the keyed-in amount (Phase 2). The ledger insert
    // moves customers.points_balance via the DB projection trigger.
    const modules = parseModules(tenantRow?.modules);
    const pointsEarned = modules.points
      ? pointsForAmount(parsed.data.amountCents ?? 0, tenantRow?.pointsPerRm ?? 0)
      : 0;
    if (pointsEarned > 0 && stampEvent) {
      await tx.insert(schema.pointEvents).values({
        tenantId,
        customerId: card.customerId,
        delta: pointsEarned,
        source: "transaction",
        staffId: admin.kind === "staff" ? admin.subjectId : null,
        stampEventId: stampEvent.id,
        outletId: servingOutletId,
      });
    }

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
        tenantId,
        cardId: card.id,
        type: defs.success && defs.data[0] ? defs.data[0].type : "reward",
        expiresAt: new Date(Date.now() + validDays * 86_400_000),
      });
    }

    const progress = computeCardProgress({
      stampsCount: newCount,
      stampsRequired: program.stampsRequired,
    });
    const [balanceRow] = await tx
      .select({ balance: schema.customers.pointsBalance })
      .from(schema.customers)
      .where(eq(schema.customers.id, card.customerId));
    return {
      customerName: customer.name ?? customer.phone ?? "Customer",
      stampsCount: newCount,
      stampsRequired: program.stampsRequired,
      stampsRemaining: progress.stampsRemaining,
      rewardEarned,
      pointsEarned,
      pointsBalance: balanceRow?.balance ?? 0,
    };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json(result);
}
