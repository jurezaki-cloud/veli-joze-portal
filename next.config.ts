import type { NextConfig } from "next";
const nextConfig:NextConfig={
 async redirects(){return [{source:"/:path*",has:[{type:"host",value:"veli-joze.eu"}],destination:"https://www.veli-joze.eu/:path*",permanent:true}]}
};
export default nextConfig;
