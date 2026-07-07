import type { NextConfig } from "next";

// Multi-zone routing (ROADMAP §3): marketing owns the base domain and
// forwards the /app and /admin path prefixes to the other two Next.js apps.
// In production these point at the deployed zone URLs; in dev, the local
// ports from `pnpm dev`.
const APP_ZONE_URL = process.env["APP_ZONE_URL"] ?? "http://localhost:3001";
const ADMIN_ZONE_URL = process.env["ADMIN_ZONE_URL"] ?? "http://localhost:3002";

const nextConfig: NextConfig = {
  transpilePackages: ["@kembali/ui", "@kembali/config", "@kembali/core"],
  async rewrites() {
    return [
      { source: "/app", destination: `${APP_ZONE_URL}/app` },
      { source: "/app/:path*", destination: `${APP_ZONE_URL}/app/:path*` },
      { source: "/admin", destination: `${ADMIN_ZONE_URL}/admin` },
      { source: "/admin/:path*", destination: `${ADMIN_ZONE_URL}/admin/:path*` },
    ];
  },
};

export default nextConfig;
