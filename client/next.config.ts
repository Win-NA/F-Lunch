import type { NextConfig } from "next";
import os from "os";

// Lấy danh sách tất cả IP nội bộ của máy tính tự động
const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (networkInterface) {
      for (const net of networkInterface) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
  }
  return ips;
};

const localIPs = getLocalIPs();

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    ...localIPs.map(ip => `${ip}:3000`),
    ...localIPs,
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
