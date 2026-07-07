import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-zone: this app is served under the base domain at /app
  // (marketing rewrites /app/* here). See ROADMAP §3 routing decision.
  basePath: "/app",
  transpilePackages: ["@kembali/ui", "@kembali/config", "@kembali/core"],
};

export default nextConfig;
