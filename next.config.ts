import type { NextConfig } from "next";
import path from "path";

const isGhPages = process.env.DEPLOY_TARGET === "gh-pages";
const basePath = isGhPages ? "/alfa" : "";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isGhPages && {
    output: "export",
    basePath,
    assetPrefix: `${basePath}/`,
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

export default nextConfig;
