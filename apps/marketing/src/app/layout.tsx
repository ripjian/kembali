import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";

import { SiteFooter } from "../components/site-footer";
import { SiteNav } from "../components/site-nav";

import "./globals.css";

// Editorial pairing (brand/DESIGN-Monad.md): the serif announces, the mono
// instructs. Fraunces is the brand display serif (BRAND.md §4); JetBrains
// Mono stands in for ABC Diatype Mono.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Kembali — loyalty cards your customers never lose",
  description:
    "Digital stamp cards for cafés, F&B, salons and gyms in Malaysia & SEA. Customers join from a QR in under 30 seconds — no app, no hardware. Make them kembali.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jetbrains.variable}`}>
      <body className="bg-bg font-mono text-text antialiased">
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
