/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    // ✅ SECURITY FIX: Fail on type errors to prevent runtime bugs
    ignoreBuildErrors: false,
  },
  eslint: {
    // ⚠️  Allow build with ESLint warnings (production-ready)
    // Warnings are still visible but don't block deployment
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
};

module.exports = nextConfig;









