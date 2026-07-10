import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { getCustomerSession } from "@/lib/auth";
import { getTenantColors } from "@/lib/tenant-theme";

import { TenantTheme } from "./tenant-theme";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Your card",
  description: "Your digital stamp card. Scan, stamp, get rewarded.",
};

export const viewport: Viewport = {
  themeColor: "#0F3D32",
};

export default async function CustomerAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Theme the signed-in customer's tenant. The tenant-scoped join page
  // ([slug]) re-themes its own subtree, so a customer of A viewing B's join
  // link still sees B's colours.
  const session = await getCustomerSession();
  const colors = session ? await getTenantColors(session.tenantId) : null;

  return (
    <div className={`${jakarta.variable} min-h-dvh bg-bg font-sans text-text`}>
      <TenantTheme tenantId={session?.tenantId ?? "default"} colors={colors}>
        {children}
      </TenantTheme>
    </div>
  );
}
