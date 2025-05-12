/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  images: {
    domains: [
      'www.leadstrack.in',
      'leadstrack.in',
      'graph.facebook.com',
      'platform-lookaside.fbsbx.com',
      'static.xx.fbcdn.net',
      'scontent.xx.fbcdn.net',
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      }
    ];
  },
  experimental: {
    serverActions: true,
    scrollRestoration: true,
  },
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  compress: true,
}

export default nextConfig;