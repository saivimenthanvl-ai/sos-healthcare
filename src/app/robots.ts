import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://sos-healthcare.vercel.app";

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
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
