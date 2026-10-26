import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Resolve public detail metadata before headers, including missing-content 404.
  htmlLimitedBots: /.*/,
  poweredByHeader:false,
  images: {unoptimized: true},
  async headers() {
    return [{source:"/:path*",headers:[
      {key:"Strict-Transport-Security",value:"max-age=31536000"},
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"X-Frame-Options",value:"SAMEORIGIN"},
      {key:"Content-Security-Policy",value:"object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self' https://accounts.google.com"},
      {key:"Content-Security-Policy-Report-Only",value:"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'"}
    ]},...["/manifest.webmanifest", "/sw.js", "/offline.html", "/veli-manifest-1.14.1.json", "/veli-sw-1.14.1.js"].map(source => ({source, headers: [{key: "Cache-Control", value: "no-cache, must-revalidate"}]}))];
  },
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "veli-joze.eu" }],
      destination: "https://www.veli-joze.eu/:path*",
      permanent: true,
    }];
  },
};

export default nextConfig;
