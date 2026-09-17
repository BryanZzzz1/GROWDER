import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['fondling-bottling-explore.ngrok-free.dev'],
};

export default nextConfig;