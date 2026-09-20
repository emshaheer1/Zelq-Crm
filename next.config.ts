import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    staleTimes: {
      dynamic: 60,
      static: 180,
    },
  },
};

export default nextConfig;
