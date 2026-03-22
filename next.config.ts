import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "hoirqrkdgbmvpwutwuwj.supabase.co" },
    ],
  },
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
