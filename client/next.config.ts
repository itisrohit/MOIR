import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['i.scdn.co'], // Allow Spotify CDN images
  },
};

export default nextConfig;
