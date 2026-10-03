import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
