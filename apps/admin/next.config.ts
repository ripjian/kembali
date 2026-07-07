import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-zone: this app is served under the base domain at /admin
  // (marketing rewrites /admin/* here). See ROADMAP §3 routing decision.
  basePath: "/admin",
  transpilePackages: ["@kembali/ui", "@kembali/config", "@kembali/core"],
};

export default nextConfig;
