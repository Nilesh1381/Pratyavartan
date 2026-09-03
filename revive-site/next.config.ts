import path from "node:path";
import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // output: 'standalone' is for self-hosted Docker builds only.
  // On Vercel, it triggers ENOENT next-server.js.nft.json with Turbopack.
  ...(isVercel
    ? {}
    : {
        output: "standalone",
        turbopack: {
          root: path.resolve(__dirname),
        },
      }),
};

export default nextConfig;
