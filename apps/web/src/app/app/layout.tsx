import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

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

export default function CustomerAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${jakarta.variable} min-h-dvh bg-bg font-sans text-text`}>
      {children}
    </div>
  );
}
