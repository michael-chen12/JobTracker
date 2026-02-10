import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/auth/login", "/auth/register", "/auth/forgot-password"],
        disallow: [
          "/dashboard/",
          "/api/",
          "/auth/callback",
          "/auth/confirm",
          "/auth/auth-code-error",
          "/auth/reset-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
