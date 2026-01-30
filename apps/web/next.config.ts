import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ["@ai-agent/core"],
  turbopack: {
    root: "/Users/zego/Demo_Hors/horos",
  },
};

export default nextConfig;
