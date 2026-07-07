import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Admin",
  description: "Merchant dashboard — programs, outlets, customers, campaigns.",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${jakarta.variable} min-h-dvh bg-bg font-sans text-text`}>
      {children}
    </div>
  );
}
