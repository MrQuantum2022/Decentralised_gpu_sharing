import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/community',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      // Proxy /api/backend/* to FastAPI so community page
      // can call backend without CORS issues in production
      {
        source: '/api/backend/:path*',
        destination: `${process.env.FASTAPI_URL || 'http://localhost:8000'}/:path*`,
      },
    ]
  },
}

export default nextConfig