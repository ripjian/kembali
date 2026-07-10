import { notFound } from "next/navigation";

import { LogoMark } from "@kembali/ui";

import { getPublicTenantBySlug } from "@/lib/join";
import { getTenantColors } from "@/lib/tenant-theme";

import { LoginForm } from "../../login-form";
import { TenantTheme } from "../../tenant-theme";

export const dynamic = "force-dynamic";

/* Tenant-scoped join: a merchant's printed QR points here. The slug alone
 * decides which merchant a new customer joins, so a logged-in customer of
 * one shop scanning another shop's code lands on that shop's join page (not
 * their own card). Themed in the merchant's brand colours. */

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicTenantBySlug(slug);
  if (!tenant) notFound();

  const colors = await getTenantColors(tenant.id);

  return (
    <TenantTheme tenantId={tenant.id} colors={colors}>
      <LoginForm
        tenantId={tenant.id}
        title={`Join ${tenant.name}`}
        phoneSubtitle="Enter your phone number to start your loyalty card."
        logo={
          tenant.logoUrl ? (
            // merchant-uploaded square logo (data URL, no optimizer)
            <img
              src={tenant.logoUrl}
              alt=""
              className="size-14 rounded-2xl border border-border object-cover"
            />
          ) : (
            <>
              <LogoMark size={40} className="dark:hidden" />
              <LogoMark size={40} mono="sand" className="hidden dark:block" />
            </>
          )
        }
      />
    </TenantTheme>
  );
}
