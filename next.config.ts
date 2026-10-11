import type { NextConfig } from "next";

const hostnameSupabase = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(hostnameSupabase ? [{ protocol: "https" as const, hostname: hostnameSupabase }] : []),
    ],
  },
};

export default nextConfig;
