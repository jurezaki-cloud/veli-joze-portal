import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "../lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // Keep noindex pages crawlable so bots can read their noindex metadata.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
