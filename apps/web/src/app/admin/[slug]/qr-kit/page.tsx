import { customerJoinUrl, deriveTenantTheme } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { asc } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { requestOrigin } from "@/lib/join";
import { getPanelContext } from "@/lib/panel";
import { getTenantColors } from "@/lib/tenant-theme";

export const dynamic = "force-dynamic";

export default async function QrKitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug);
  const db = await getDb();

  const outlets = await withTenant(db, ctx.tenant.id, async (tx) =>
    tx
      .select({ id: schema.outlets.id, name: schema.outlets.name })
      .from(schema.outlets)
      .orderBy(asc(schema.outlets.createdAt)),
  );

  const origin = await requestOrigin();
  const joinUrl = customerJoinUrl(origin, ctx.tenant.slug);
  const colors = await getTenantColors(ctx.tenant.id);
  const theme = deriveTenantTheme(
    colors?.primary ?? "#0f3d32",
    colors?.accent ?? "#e0684b",
    "#ffffff",
  );
  const downloadBase = `${ctx.base}/qr-kit/download`;

  // One kit per outlet when a merchant runs more than one; otherwise a single
  // kit with no outlet label.
  const kits =
    outlets.length > 1
      ? outlets.map((o) => ({ label: o.name, outlet: o.id }))
      : [{ label: null as string | null, outlet: null as string | null }];

  const previewOutlet = kits[0]?.outlet;
  const previewPng = `${downloadBase}?format=png${previewOutlet ? `&outlet=${previewOutlet}` : ""}`;

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">QR kit</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Print this and put it on your counter. Customers scan it to start
          their card in seconds.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Poster preview in the shop's brand colours */}
        <section className="rounded-2xl border border-border bg-surface p-4">
          <div
            className="mx-auto flex max-w-[280px] flex-col items-center gap-3 rounded-xl border border-border p-6 text-center"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div
              className="h-1.5 w-full rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
            <p
              className="text-base font-semibold"
              style={{ color: theme.primaryText }}
            >
              {ctx.tenant.name}
            </p>
            <p className="text-xs" style={{ color: "#5c6b60" }}>
              Scan to collect stamps
            </p>
            {/* server-generated PNG (data-plane route), nothing to optimize */}
            <img
              src={previewPng}
              alt="Join QR code"
              className="size-40 rounded-lg border border-border"
            />
            <p className="break-all font-mono text-[10px]" style={{ color: "#8b9689" }}>
              {joinUrl}
            </p>
          </div>
        </section>

        {/* Downloads, one set per outlet if outlets differ */}
        <section className="flex flex-col gap-3">
          <p className="text-sm text-text-secondary">
            The code opens your join page. Every outlet uses the same link;
            each kit below just prints that outlet&apos;s name.
          </p>
          {kits.map((kit, i) => {
            const q = kit.outlet ? `&outlet=${kit.outlet}` : "";
            return (
              <div
                key={kit.outlet ?? `kit-${i}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <p className="text-sm font-medium text-text">
                  {kit.label ?? "Counter kit"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`${downloadBase}?format=a4${q}`}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary hover:bg-primary-hover"
                  >
                    A4 poster
                  </a>
                  <a
                    href={`${downloadBase}?format=a5${q}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
                  >
                    A5 poster
                  </a>
                  <a
                    href={`${downloadBase}?format=png${q}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-alt"
                  >
                    QR code (PNG)
                  </a>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
