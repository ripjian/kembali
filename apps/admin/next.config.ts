import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kembali/ui", "@kembali/config", "@kembali/core"],
};

export default nextConfig;
