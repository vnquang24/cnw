import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/cnw/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "9000",
        pathname: "/cnw/**",
      },
    ],
  },
  // Tăng giới hạn body size cho Server Actions (nếu dùng)
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
};

export default nextConfig;
