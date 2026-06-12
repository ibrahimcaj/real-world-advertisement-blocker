import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // prevents turbopack from picking up the wrong workspace root when multiple lockfiles exist
    root: ".",
  },
};

export default nextConfig;
