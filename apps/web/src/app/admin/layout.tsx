import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { readAdminTheme } from "@/lib/admin-theme";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Admin",
  description: "Merchant dashboard for programs, outlets, customers and campaigns.",
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Explicit light/dark override (persisted); unset = follow the system.
  const theme = await readAdminTheme();
  return (
    <div
      data-theme={theme || undefined}
      className={`${jakarta.variable} min-h-dvh bg-bg font-sans text-text`}
    >
      {children}
    </div>
  );
}
