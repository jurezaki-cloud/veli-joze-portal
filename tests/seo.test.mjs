import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SEO_ROUTES, SITE_ORIGIN, absoluteSeoUrl, pageMetadata, sitemapPaths } from "../src/lib/seo.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = (path) => readFileSync(join(root, path), "utf8");

test("HTTPS canonical origin and unique per-route self-canonicals", () => {
  assert.equal(SITE_ORIGIN, "https://www.veli-joze.eu");
  const paths = Object.keys(SEO_ROUTES);
  assert.equal(new Set(paths.map(absoluteSeoUrl)).size, paths.length);
  for (const path of paths) {
    const data = pageMetadata(path);
    assert.equal(data.alternates.canonical, absoluteSeoUrl(path), path);
    assert.equal(new URL(absoluteSeoUrl(path)).protocol, "https:");
    assert.equal(data.description, SEO_ROUTES[path].description);
    assert.equal(data.robots.index, SEO_ROUTES[path].indexable);
    assert.equal(data.openGraph.url, absoluteSeoUrl(path));
    assert.ok(data.title.absolute.length > 10);
  }
});

test("sitemap has only confirmed public indexable pages", () => {
  assert.deepEqual(sitemapPaths, ["/", "/informacije", "/sos"]);
  assert.ok(sitemapPaths.every((path) => SEO_ROUTES[path].inSitemap && SEO_ROUTES[path].indexable));
  const implementation = source("src/app/sitemap.ts");
  assert.match(implementation, /sitemapPaths\.map/);
  assert.match(implementation, /absoluteSeoUrl\(path\)/);
  assert.doesNotMatch(implementation, /lastModified/);
});

test("private/member/moderation paths are noindex and omitted from sitemap", () => {
  for (const path of ["/admin", "/prijava", "/registracija", "/profil", "/klepet", "/pavsalisti", "/oglasi", "/tezave"]) {
    const data = pageMetadata(path);
    assert.equal(data.robots.index, false, path);
    assert.equal(data.robots.follow, false, path);
    assert.ok(!sitemapPaths.includes(path), path);
  }
  for (const path of ["/", "/informacije", "/sos", "/dogodki", "/obvestila"]) {
    assert.equal(pageMetadata(path).robots.index, true, path);
  }
});

test("every App Router page has exact per-route metadata (including client routes)", () => {
  const app = join(root, "src/app");
  assert.match(source("src/app/page.tsx"), /export const metadata\s*=\s*pageMetadata\("\/"\)/);
  const pageDirs = readdirSync(app, { withFileTypes: true })
    .filter((item) => item.isDirectory() && existsSync(join(app, item.name, "page.tsx")))
    .map((item) => item.name);
  assert.equal(pageDirs.length, Object.keys(SEO_ROUTES).length - 1);
  for (const segment of pageDirs) {
    const path = `/${segment}`;
    assert.ok(Object.hasOwn(SEO_ROUTES, path), `Missing route policy ${path}`);
    const layoutPath = join(app, segment, "layout.tsx");
    assert.ok(existsSync(layoutPath), `Missing layout: ${path}`);
    assert.ok(readFileSync(layoutPath, "utf8").includes(`pageMetadata("${path}")`), `Wrong metadata for ${path}`);
  }
  assert.doesNotMatch(source("src/app/layout.tsx"), /alternates\s*:\s*\{\s*canonical/);
  assert.doesNotMatch(source("src/app/layout.tsx"), /url:\s*"https:\/\/www\.veli-joze\.eu"/);
});

test("robots advertises sitemap and keeps noindex pages crawlable", () => {
  const implementation = source("src/app/robots.ts");
  assert.match(implementation, /SITE_ORIGIN/);
  assert.match(implementation, /\/sitemap\.xml/);
  assert.match(implementation, /disallow:\s*\["\/api\/"\]/);
  for (const page of ["/profil", "/prijava", "/registracija"]) {
    assert.ok(!implementation.includes(`"${page}"`), `Do not hide noindex metadata of ${page}`);
  }
});
