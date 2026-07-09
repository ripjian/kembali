import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { schema, withTenant } from "@kembali/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getCustomerSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

import { RedeemConfirm } from "./redeem-confirm";

export const dynamic = "force-dynamic";

export default async function RewardDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getCustomerSession();
  if (!session) redirect("/app/login");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { error } = await searchParams;

  const db = await getDb();
  const data = await withTenant(db, session.tenantId, async (tx) => {
    const [item] = await tx
      .select()
      .from(schema.rewardItems)
      .where(and(eq(schema.rewardItems.id, id), eq(schema.rewardItems.active, true)));
    if (!item) return null;
    const [customer] = await tx
      .select({ balance: schema.customers.pointsBalance })
      .from(schema.customers)
      .where(eq(schema.customers.id, session.customerId));
    return { item, balance: customer?.balance ?? 0 };
  });
  if (!data) notFound();
  const { item, balance } = data;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-5 px-5 py-8">
      <header>
        <Link href="/app" className="text-xs font-medium text-text-muted hover:text-text">
          ← Back to your card
        </Link>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {item.imageUrl ? (
          // data URL, nothing to optimize
          <img src={item.imageUrl} alt="" className="aspect-square w-full object-cover" />
        ) : (
          <div className="grid aspect-[2/1] w-full place-items-center bg-surface-alt text-4xl">
            🎁
          </div>
        )}
        <div className="p-6">
          <h1 className="text-lg font-semibold text-text">{item.title}</h1>
          <p className="mt-1 text-sm tabular-nums text-text-secondary" data-stat>
            {item.pointsCost} points
          </p>
          {item.description && (
            <p className="mt-3 text-sm text-text-secondary">{item.description}</p>
          )}
          <p className="mt-3 text-xs text-text-muted">
            You have{" "}
            <span className="font-semibold tabular-nums text-text" data-stat>
              {balance}
            </span>{" "}
            points.
          </p>
        </div>
      </section>

      {error === "points" && (
        <p role="alert" className="rounded-xl border border-error/40 bg-surface px-4 py-3 text-sm text-error">
          You don&apos;t have enough points yet. A few more visits will get
          you there.
        </p>
      )}

      <div className="mt-auto pb-4">
        <RedeemConfirm
          rewardItemId={item.id}
          title={item.title}
          pointsCost={item.pointsCost}
          affordable={balance >= item.pointsCost}
          balance={balance}
        />
      </div>
    </main>
  );
}
