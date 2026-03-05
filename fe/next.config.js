/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Tắt strict mode để tránh double render trong dev
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
  // Faster hot reload
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Loại trừ các backend-only packages khỏi bundle client
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
      }
    }
    return config
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
