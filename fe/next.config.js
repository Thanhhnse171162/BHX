/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
  // Faster hot reload
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Proxy API calls to backend services to avoid CORS issues
  async rewrites() {
    const IAM_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://localhost:5000'
    return [
      {
        source: '/iam/:path*',
        destination: `${IAM_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
