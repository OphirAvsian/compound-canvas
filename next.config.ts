import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["ketcher-core", "ketcher-react", "ketcher-standalone", "molstar"],
  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      canvas: false,
      fs: false,
      jsdom: false,
      path: false,
      "jsdom/lib/jsdom/living/generated/utils": false,
      "paper$": "paper/dist/paper-core.js",
      "paper/dist/node/extend.js": false,
      "paper/dist/node/self.js": false,
      [path.resolve(process.cwd(), "node_modules/paper/dist/node/extend.js")]: false,
      [path.resolve(process.cwd(), "node_modules/paper/dist/node/self.js")]: false,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
