import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { schema, withTenant } from "@kembali/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getCustomerSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

import { cancelRedemption } from "../../actions";
import { CouponQr } from "./coupon-qr";

export const dynamic = "force-dynamic";

export default async function CouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCustomerSession();
  if (!session) redirect("/app/login");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = await getDb();
  const data = await withTenant(db, session.tenantId, async (tx) => {
    const [row] = await tx
      .select({
        id: schema.redemptions.id,
        code: schema.redemptions.code,
        state: schema.redemptions.state,
        pointsCost: schema.redemptions.pointsCost,
        expiresAt: schema.redemptions.expiresAt,
        redeemedAt: schema.redemptions.redeemedAt,
        title: schema.rewardItems.title,
      })
      .from(schema.redemptions)
      .innerJoin(
        schema.rewardItems,
        eq(schema.redemptions.rewardItemId, schema.rewardItems.id),
      )
      .where(
        and(
          eq(schema.redemptions.id, id),
          eq(schema.redemptions.customerId, session.customerId),
        ),
      );
    return row ?? null;
  });
  if (!data) notFound();

  // A reserved coupon past its window reads as expired - the confirm API
  // applies the same rule, so the screen never promises what staff can't scan.
  const state =
    data.state === "reserved" && data.expiresAt < new Date() ? "expired" : data.state;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-5 px-5 py-8">
      <header>
        <Link href="/app" className="text-xs font-medium text-text-muted hover:text-text">
          ← Back to your card
        </Link>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-text">{data.title}</h1>
        <p className="mt-1 text-xs tabular-nums text-text-muted" data-stat>
          {data.pointsCost} points
        </p>

        {state === "reserved" && (
          <>
            <p className="mt-4 text-sm text-text-secondary">
              Show this to the staff. It works once and expires at{" "}
              {formatDateTime(data.expiresAt)}.
            </p>
            <div className="mt-5">
              <CouponQr code={data.code} live />
            </div>
            <form action={cancelRedemption} className="mt-5">
              <input type="hidden" name="redemptionId" value={data.id} />
              <button className="text-xs font-medium text-text-muted underline hover:text-text">
                Changed your mind? Cancel this coupon
              </button>
            </form>
          </>
        )}

        {state === "redeemed" && (
          <div className="mt-5 rounded-xl border border-leaf/50 bg-surface p-5" data-coupon-state="redeemed">
            <p className="text-2xl">🎉</p>
            <p className="mt-2 text-sm font-semibold text-text">
              Redeemed. Enjoy your {data.title.toLowerCase()}.
            </p>
            {data.redeemedAt && (
              <p className="mt-1 text-xs text-text-muted">
                {formatDateTime(data.redeemedAt)}
              </p>
            )}
          </div>
        )}

        {state === "expired" && (
          <div className="mt-5 rounded-xl bg-surface-alt p-5" data-coupon-state="expired">
            <p className="text-sm font-semibold text-text">
              This coupon has expired.
            </p>
            <p className="mt-1 text-xs text-text-muted">
              No points were taken. Redeem again when you&apos;re at the store.
            </p>
          </div>
        )}

        {state === "cancelled" && (
          <div className="mt-5 rounded-xl bg-surface-alt p-5" data-coupon-state="cancelled">
            <p className="text-sm font-semibold text-text">
              You cancelled this coupon.
            </p>
            <p className="mt-1 text-xs text-text-muted">
              No points were taken. Your rewards are waiting when you&apos;re
              ready.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
