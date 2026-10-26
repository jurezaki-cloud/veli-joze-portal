import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_ROUTES, SITE_ORIGIN, sitemapPaths } from "../src/lib/seo.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const built = (...segments) => readFileSync(join(root, ".next", "server", "app", ...segments), "utf8");

test("all 18 built HTML pages have exactly one self-canonical and correct robots directives", () => {
  for (const [path, settings] of Object.entries(SEO_ROUTES)) {
    const html = built(path === "/" ? "index.html" : `${path.slice(1)}.html`);
    const expectedUrl = path === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;
    const canonicalTags = [...html.matchAll(/<link rel="canonical"[^>]+>/g)].map((m) => m[0]);
    assert.equal(canonicalTags.length, 1, `Canonical count for ${path}`);
    assert.ok(canonicalTags[0].includes(`href="${expectedUrl}"`), `Canonical of ${path}: ${canonicalTags[0]}`);
    assert.ok(html.includes('<meta name="description"'), `Description for ${path}`);
    const robots = settings.indexable ? "index, follow" : "noindex, nofollow";
    assert.ok(html.includes(`<meta name="robots" content="${robots}"/>`), `Robots for ${path}`);
  }
});

test("built robots.txt advertises the canonical sitemap and noindex pages are crawlable", () => {
  const robots = built("robots.txt.body");
  assert.ok(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`));
  assert.ok(robots.includes("Disallow: /api/"));
  assert.ok(!robots.includes("Disallow: /profil"));
});

test("built sitemap has exactly the allowlisted canonical URLs", () => {
  const xml = built("sitemap.xml.body");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(urls, sitemapPaths.map((p) => new URL(p, SITE_ORIGIN).toString()));
});
