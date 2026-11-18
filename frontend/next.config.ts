import type { NextConfig } from "next";

// Rewrites are materialised at build time, so production images must be built
// with API_INTERNAL_URL set to the real internal API origin.
function apiOrigin(): string {
  try {
    return new URL(process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000/api/v1").origin;
  } catch {
    return "http://127.0.0.1:8000";
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*/",
        destination: `${apiOrigin()}/api/v1/:path*/`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin()}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
