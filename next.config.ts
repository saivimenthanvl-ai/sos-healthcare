import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// In development, Next.js / Turbopack hot reload overlay and eval tooling require 'unsafe-eval' on script-src.
// In production, eval is strictly disabled and blocked for enterprise clinical security.
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval' https://tiles.openfreemap.org"
  : "'self' 'unsafe-inline' https://tiles.openfreemap.org";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "img-src 'self' data: blob: https://*.googleusercontent.com https://tiles.openfreemap.org https://*.tile.openstreetmap.org",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline' https://tiles.openfreemap.org",
      `script-src ${scriptSrc}`,
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://tiles.openfreemap.org https://api.openrouteservice.org https://overpass-api.de https://nominatim.openstreetmap.org https://accounts.google.com https://oauth2.googleapis.com https://health.googleapis.com",
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/terms", destination: "/terms-of-service", permanent: true },
    ];
  },
};

export default nextConfig;
