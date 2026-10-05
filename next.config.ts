import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/terms", destination: "/terms-of-service", permanent: true },
    ];
  },
};

export default nextConfig;
