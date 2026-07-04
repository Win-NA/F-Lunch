import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '192.168.1.8:3000',
    '192.168.1.8',
    'f-lunch-client-nhat-anh.loca.lt',
    '*.loca.lt',
    '*.ngrok-free.app'
  ],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3001/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
