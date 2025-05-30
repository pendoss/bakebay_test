/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ['s3.diploma.larek.tech'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.diploma.larek.tech',
        port: '',
        pathname: '/bakebay/**',
        search: '',
      }],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build:
      // Module not found: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;