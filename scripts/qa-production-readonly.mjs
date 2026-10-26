#!/usr/bin/env node
/**
 * Read-only live QA for Veli Jože. Never supplies cookies/credentials or sends
 * mutations. Intentionally NOT a CI build gate: production can be unavailable.
 *
 * Usage: node scripts/qa-production-readonly.mjs
 * Exit 0 only if externally observable SEO, privacy and HTTPS checks pass.
 */
const ORIGIN = "https://www.veli-joze.eu";
const privatePaths = [
  "/prijava", "/registracija", "/profil", "/klepet", "/admin",
  "/moj-portal", "/moja-parcela", "/sporocila", "/moja-zasebnost",
];
const privateApis = [
  "/api/messages", "/api/messages/summary", "/api/profile",
  "/api/my-portal", "/api/my-parcel", "/api/admin/overview",
  "/api/privacy/export", "/api/notifications", "/api/push-subscription",
];
const failures = [];
let checks = 0;
function test(ok, name, details = "") {
  checks++;
  const line = [ok ? "PASS" : "FAIL", name, details].filter(Boolean).join(" | ");
  console.log(line);
  if (!ok) failures.push(line);
}
async function get(url, readBody = false) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(12000),
    headers: { "user-agent": "VeliJozeReadOnlyQA/1.0" },
  });
  const body = readBody ? await response.text() : "";
  return { status: response.status, headers: response.headers, body };
}
function attrTag(source, tag, key, keyValue, attribute) {
  const rx = new RegExp("<" + tag + "\\b[^>]*>", "gi");
  for (const match of source.matchAll(rx)) {
    const attrs = Object.fromEntries(
      [...match[0].matchAll(/([\w:-]+)=["']([^"']*)["']/g)]
        .map(m => [m[1].toLowerCase(), m[2]])
    );
    if (attrs[key] === keyValue) return attrs[attribute] || "";
  }
  return "";
}
function robotsOf(result) {
  return attrTag(result.body, "meta", "name", "robots", "content") ||
    result.headers.get("x-robots-tag") || "";
}
function canonicalOf(result) {
  return attrTag(result.body, "link", "rel", "canonical", "href");
}
function sameUrl(a, b) { return a.replace(/\/$/, "") === b.replace(/\/$/, ""); }
async function checked(url, label, withBody = false) {
  try { return await get(url, withBody); }
  catch (err) {
    test(false, label, err.name || "request failed");
    return null;
  }
}
const home = await checked(ORIGIN + "/", "HTTPS home reachable", true);
if (home) {
  test(home.status === 200, "HTTPS home status", String(home.status));
  test(!!home.headers.get("strict-transport-security"), "HSTS on HTTPS");
  test(home.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options");
  test(!!home.headers.get("content-security-policy"), "Content-Security-Policy");
}
for (const source of [
  "http://www.veli-joze.eu/",
  "http://www.veli-joze.eu/prijava",
  "http://veli-joze.eu/",
  "https://veli-joze.eu/",
]) {
  // cPanel can first upgrade the apex domain to HTTPS; Next.js then adds www.
  // Every hop must be permanent, upgrade to HTTPS, and preserve path and query.
  let current = source;
  let hops = 0;
  let reachedPage = false;
  const visited = new Set();
  const pathAndQuery = new URL(source).pathname + new URL(source).search;
  const expected = new URL(pathAndQuery, ORIGIN).href;
  const chain = [];
  while (hops < 4 && !visited.has(current)) {
    visited.add(current);
    const response = await checked(current, "Redirect reachable: " + current);
    if (!response) break;
    if (response.status === 200) {
      reachedPage = true;
      break;
    }
    const location = response.headers.get("location");
    if (![301, 308].includes(response.status) || !location) break;
    const next = new URL(location, current);
    chain.push(String(response.status) + " to " + next.href);
    if (next.protocol !== "https:" ||
        !["veli-joze.eu", "www.veli-joze.eu"].includes(next.hostname) ||
        next.pathname + next.search !== pathAndQuery) break;
    current = next.href;
    hops++;
  }
  test(
    reachedPage && hops > 0 && hops < 4 && sameUrl(current, expected),
    "Permanent canonical HTTPS redirect: " + source,
    chain.join(" | ") || "missing redirect"
  );
}
const robots = await checked(ORIGIN + "/robots.txt", "robots.txt reachable", true);
if (robots) {
  test(robots.status === 200, "robots.txt status");
  test(robots.body.includes("Sitemap: " + ORIGIN + "/sitemap.xml"), "robots sitemap reference");
}
const map = await checked(ORIGIN + "/sitemap.xml", "sitemap.xml reachable", true);
if (map) {
  test(map.status === 200, "sitemap.xml status");
  const entries = [...map.body.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)].map(m => m[1]);
  test(entries.length > 0 && entries.length < 500, "Sitemap URL count", String(entries.length));
  test(new Set(entries).size === entries.length, "No duplicate sitemap URLs");
  test(entries.every(url => url.startsWith(ORIGIN + "/")), "Only canonical HTTPS origin in sitemap");
  // Cap concurrency so live production is never flooded.
  let index = 0;
  const workers = Array.from({ length: 3 }, async () => {
    while (index < entries.length) {
      const url = entries[index++];
      const result = await checked(url, "Sitemap URL reachable: " + new URL(url).pathname, true);
      if (!result) continue;
      const path = new URL(url).pathname;
      const canonical = canonicalOf(result);
      test(result.status === 200, "Sitemap URL HTTP 200: " + path, String(result.status));
      test(sameUrl(canonical, url), "Sitemap self-canonical: " + path, canonical);
      test(/(?:^|[\s,])index(?:[\s,]|$)/i.test(robotsOf(result)) &&
        !/(?:^|[\s,])noindex(?:[\s,]|$)/i.test(robotsOf(result)),
        "Sitemap indexable: " + path, robotsOf(result));
    }
  });
  await Promise.all(workers);
}
for (const path of privatePaths) {
  const response = await checked(ORIGIN + path, "Private page reachable: " + path, true);
  if (!response) continue;
  test(response.status === 200, "Private page HTML available: " + path, String(response.status));
  test(/noindex/i.test(robotsOf(response)), "Private page noindex: " + path, robotsOf(response));
}
for (const path of privateApis) {
  const response = await checked(ORIGIN + path, "Protected API reachable: " + path);
  if (response) test([401, 403].includes(response.status),
    "Protected API denies anonymous GET: " + path, String(response.status));
}
for (const path of ["/dogodki/not-a-valid-id", "/obvestila/not-a-valid-id"]) {
  const response = await checked(ORIGIN + path, "Missing public detail reachable: " + path, true);
  if (!response) continue;
  test(response.status === 404, "Missing content status 404: " + path, String(response.status));
  test(/noindex/i.test(robotsOf(response)), "Missing content noindex: " + path, robotsOf(response));
}
console.log("SUMMARY", JSON.stringify({ checks, passed: checks - failures.length, failed: failures.length }));
if (failures.length) process.exitCode = 1;
