import type { MetadataRoute } from "next";
import { absoluteSeoUrl, sitemapPaths } from "../lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapPaths.map((path) => ({ url: absoluteSeoUrl(path) }));
}
