import type { NextConfig } from "next";
import path from "path";

const isGhPages = process.env.DEPLOY_TARGET === "gh-pages";
const basePath = isGhPages ? "/alfa" : "";
const localChatBackend = process.env.LOCAL_CHAT_BACKEND_URL ?? "http://127.0.0.1:3011";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(!isGhPages && {
    async rewrites() {
      return [
        { source: "/api/chat", destination: `${localChatBackend}/api/chat` },
        { source: "/api/health", destination: `${localChatBackend}/api/health` },
      ];
    },
  }),
  ...(isGhPages && {
    output: "export",
    basePath,
    assetPrefix: `${basePath}/`,
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

export default nextConfig;
