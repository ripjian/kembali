import type { Metadata } from "next";

import "./globals.css";

// Root layout is deliberately bare: each surface — (marketing) at /,
// customer PWA at /app, admin at /admin — owns its fonts, theme and chrome
// in its own nested layout.
export const metadata: Metadata = {
  title: {
    default: "Kembali",
    template: "%s — Kembali",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
