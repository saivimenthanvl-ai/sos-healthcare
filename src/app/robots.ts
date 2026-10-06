import type { MetadataRoute } from "next";

const BASE_URL = "https://sos-healthcare.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/privacy-policy",
          "/terms-of-service",
          "/contact",
        ],
        disallow: [
          "/dashboard",
          "/profile",
          "/emergency",
          "/appointments",
          "/admin",
          "/doctor",
          "/dispatch",
          "/devices",
          "/auth",
          "/api",
        ],
      },
    ],
    sitemap: `${BASE_URL}/google-sitemap.xml`,
    host: BASE_URL,
  };
}
