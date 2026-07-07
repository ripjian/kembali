import type { NextConfig } from "next";

// One server, one route tree (ROADMAP §3): marketing at /, customer PWA
// under /app, merchant admin under /admin — no zones, no rewrites.

const isDev = process.env.NODE_ENV === "development";

// Security headers — SECURITY.md hard rule #8. Loosening any of these
// needs a ROADMAP decision-log entry.
// CSP notes: next/font self-hosts fonts (no external font origin);
// 'unsafe-inline' script-src is the pragmatic Next.js baseline — moving to
// nonces is a Phase 1 hardening task. Dev needs eval + websockets for HMR.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    // camera: cashier QR scanner (Phase 1); geolocation: outlet features later
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self), payment=()",
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@kembali/ui", "@kembali/config", "@kembali/core"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
