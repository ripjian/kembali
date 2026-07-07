import type { NextConfig } from "next";

// One server, one route tree (ROADMAP §3): marketing at /, customer PWA
// under /app, merchant admin under /admin — no zones, no rewrites.
const nextConfig: NextConfig = {
  transpilePackages: ["@kembali/ui", "@kembali/config", "@kembali/core"],
};

export default nextConfig;
