import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Lets a candidate build sit next to the live one for side-by-side testing
  // (NEXT_DIST_DIR=.next-candidate). Unset everywhere else, so builds go to .next as before.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
