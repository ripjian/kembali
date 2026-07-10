import { NextResponse } from "next/server";

import { QR_TOKEN_TTL_SECONDS, signQrToken } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { eq } from "drizzle-orm";

import { getCustomerSession } from "@/lib/auth";
import { qrTokenSecret } from "@/lib/config";
import { getDb } from "@/lib/db";

/** Short-lived signed stamp token for the logged-in customer's card -
 * refetched by the card page every ~60s (SECURITY.md rule 5). */
export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to see your code." }, { status: 401 });
  }
  const db = await getDb();
  const card = await withTenant(db, session.tenantId, async (tx) => {
    const [row] = await tx
      .select({ id: schema.cards.id })
      .from(schema.cards)
      .where(eq(schema.cards.customerId, session.customerId));
    return row ?? null;
  });
  if (!card) {
    return NextResponse.json(
      { error: "You don't have a card yet. Ask staff to set you up at the counter." },
      { status: 404 },
    );
  }
  const token = signQrToken(
    { cardId: card.id, tenantId: session.tenantId },
    qrTokenSecret(),
  );
  return NextResponse.json({ token, ttlSeconds: QR_TOKEN_TTL_SECONDS });
}
