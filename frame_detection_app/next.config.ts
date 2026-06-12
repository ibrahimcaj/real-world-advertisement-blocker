import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // required to load instrumentation.ts on startup
    instrumentationHook: true,
  },
};

export default nextConfig;
