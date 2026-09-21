import { planAllowsReportDownload } from "@kembali/core";

import { getDb } from "@/lib/db";
import { getPanelContext } from "@/lib/panel";
import {
  fetchActivityReport,
  fetchCustomersReport,
  fetchReferralsReport,
  fetchRewardsReport,
  fetchTransactionsReport,
  readDateRange,
  readSegment,
  toCsv,
  type TxnTypeFilter,
} from "@/lib/report-data";

/* CSV export for analytics reports. Gated to Founding + Growth plans
 * (planAllowsReportDownload); Starter/Trial get 403. This is ANALYTICS
 * only; the PDPA customer-data export is a separate, always-free feature. */

const RM = (cents: number) => (cents / 100).toFixed(2);
const iso = (d: Date) => d.toISOString();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  if (!ctx.tenant.modules.reports || !ctx.can("viewReports")) {
    return new Response("Not allowed", { status: 403 });
  }
  if (!planAllowsReportDownload(ctx.tenant.plan)) {
    return new Response(
      "Report downloads are available on the Founding and Growth plans.",
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "customers";
  const range = readDateRange({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  const db = await getDb();

  let filename: string;
  let csv: string;

  if (type === "transactions") {
    const txn = (url.searchParams.get("txn") ?? "all") as TxnTypeFilter;
    const outlet = url.searchParams.get("outlet") || null;
    const staff = url.searchParams.get("staff") || null;
    const { rows } = await fetchTransactionsReport(db, ctx.tenant.id, range, txn, outlet, staff);
    filename = "transactions";
    csv = toCsv(
      ["Date", "Type", "Customer", "Outlet", "Served by", "Amount (RM)", "Points"],
      rows.map((r) => [
        iso(r.at),
        r.kind,
        r.customer,
        r.outlet ?? "",
        r.staff ?? "",
        r.amountCents != null ? RM(r.amountCents) : "",
        r.points != null ? r.points : "",
      ]),
    );
  } else if (type === "activity") {
    const { byDay } = await fetchActivityReport(db, ctx.tenant.id, range);
    filename = "activity";
    csv = toCsv(
      ["Day", "Visits", "Members", "New members", "Sales (RM)", "Points earned"],
      byDay.map((d) => [d.day, d.visits, d.members, d.newMembers, RM(d.salesCents), d.points]),
    );
  } else if (type === "referrals") {
    const rows = await fetchReferralsReport(db, ctx.tenant.id, range);
    filename = "referrals";
    csv = toCsv(
      ["Invited on", "Invited by", "Friend", "Status", "Note", "First visit", "Inviter got", "Friend got"],
      rows.map((r) => [
        iso(r.at),
        r.referrer,
        r.referee,
        r.state,
        r.note ?? "",
        r.qualifiedAt ? iso(r.qualifiedAt) : "",
        r.referrerGot,
        r.refereeGot,
      ]),
    );
  } else if (type === "rewards") {
    const rows = await fetchRewardsReport(db, ctx.tenant.id, range);
    filename = "rewards";
    csv = toCsv(
      ["Date", "Reward", "Customer", "Points cost", "State", "Confirmed by"],
      rows.map((r) => [iso(r.at), r.reward, r.customer, r.pointsCost, r.state, r.staff]),
    );
  } else {
    const segment = readSegment(url.searchParams.get("segment") ?? undefined);
    const rows = await fetchCustomersReport(db, ctx.tenant.id, range, segment);
    filename = segment === "all" ? "customers" : `customers-${segment}`;
    csv = toCsv(
      ["Customer", "Phone", "Joined", "Visits", "Spend (RM)", "Points", "Last visit"],
      rows.map((r) => [
        r.name,
        r.phone,
        iso(r.joined),
        r.visits,
        RM(r.spendCents),
        r.points,
        r.lastVisit ? iso(r.lastVisit) : "",
      ]),
    );
  }

  const stamp = toDate(range.to);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ctx.tenant.slug}-${filename}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function toDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
