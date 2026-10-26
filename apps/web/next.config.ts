import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@stayshay/core"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async rewrites() {
    return [
      { source: "/.well-known/ai-plugin.json", destination: "/api/discovery/ai-plugin" },
      { source: "/.well-known/mcp.json", destination: "/api/discovery/mcp" },
      { source: "/.well-known/mcp/server-card.json", destination: "/api/discovery/mcp" },
    ];
  },
  async redirects() {
    // Friendly short URLs people (and assistants) guess.
    return [
      { source: "/bed-space", destination: "/rent/bed-space", permanent: true },
      { source: "/bed-spaces", destination: "/rent/bed-space", permanent: true },
      { source: "/partitions", destination: "/rent/partitions", permanent: true },
      { source: "/rooms", destination: "/rent/rooms", permanent: true },
      { source: "/studios", destination: "/rent/studios", permanent: true },
      { source: "/guides", destination: "/blog", permanent: true },
    ];
  },
};

export default nextConfig;
