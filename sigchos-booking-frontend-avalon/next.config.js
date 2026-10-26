/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/landing',
        permanent: true
      }
    ];
  },
  async rewrites() {
    // Solo aplica rewrite en desarrollo local.
    // En producción (Vercel), el frontend llama directo a NEXT_PUBLIC_API_BASE_URL.
    if (process.env.NODE_ENV === 'production') return [];

    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
