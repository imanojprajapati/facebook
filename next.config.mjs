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
      'scontent.xx.fbcdn.net'
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
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://www.leadstrack.in' 
              : 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/auth/callback/facebook',
          destination: process.env.NODE_ENV === 'production'
            ? 'https://www.leadstrack.in/api/auth/callback/facebook'
            : 'http://localhost:3000/api/auth/callback/facebook'
        }
      ]
    }
  }
};

export default nextConfig;