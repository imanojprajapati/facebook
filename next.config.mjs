/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'www.leadstrack.in',
      'leadstrack.in',
      'graph.facebook.com',
      'platform-lookaside.fbsbx.com',
      'static.xx.fbcdn.net',
      'scontent.xx.fbcdn.net',
      'localhost'
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
    ]
  },
  output: 'standalone',
  poweredByHeader: false,
  env: {
    NEXTAUTH_URL: process.env.NODE_ENV === 'production' 
      ? 'https://www.leadstrack.in' 
      : 'http://localhost:3000'
  }
};

export default nextConfig;