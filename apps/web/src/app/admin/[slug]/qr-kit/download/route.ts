import { customerJoinUrl } from "@kembali/core";
import { schema, withTenant } from "@kembali/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { requestOrigin } from "@/lib/join";
import { getPanelContext } from "@/lib/panel";
import { generateKitPdf, generateKitPng } from "@/lib/qr-kit";
import { getTenantColors } from "@/lib/tenant-theme";

/* Streams a print-ready QR kit file. getPanelContext authorizes the caller
 * for this slug (staff of the store or a platform admin). The QR always
 * encodes the tenant-scoped join URL; the outlet only labels the poster. */

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kit";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ctx = await getPanelContext(slug); // redirects if not authorized

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "a4";
  const outletParam = url.searchParams.get("outlet");

  const db = await getDb();
  const origin = await requestOrigin();
  const joinUrl = customerJoinUrl(origin, ctx.tenant.slug);
  const colors = await getTenantColors(ctx.tenant.id);

  let outletName: string | null = null;
  if (outletParam && z.uuid().safeParse(outletParam).success) {
    outletName = await withTenant(db, ctx.tenant.id, async (tx) => {
      const [o] = await tx
        .select({ name: schema.outlets.name })
        .from(schema.outlets)
        .where(
          and(
            eq(schema.outlets.id, outletParam),
            eq(schema.outlets.tenantId, ctx.tenant.id),
          ),
        );
      return o?.name ?? null;
    });
  }

  const input = {
    shopName: ctx.tenant.name,
    joinUrl,
    outletName,
    logoDataUrl: ctx.tenant.logoUrl,
    primary: colors?.primary ?? null,
    accent: colors?.accent ?? null,
  };

  const base = slugify(
    outletName ? `${ctx.tenant.name}-${outletName}` : ctx.tenant.name,
  );

  if (format === "png") {
    const png = await generateKitPng(input);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${base}-qr.png"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const size = format === "a5" ? "a5" : "a4";
  const pdf = await generateKitPdf(input, size);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${base}-qr-${size}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
