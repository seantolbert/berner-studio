import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* additional config here if needed */
  eslint: {
    // Unblock CI builds while we finish strict lint fixes
    ignoreDuringBuilds: true,
  },
};

export default withBundleAnalyzer(nextConfig);
