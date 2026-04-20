/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {protocol: 'https', hostname: 's3.diploma.larek.tech', pathname: '/bakebay/**'},
            {protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/bakebay/**'},
            {protocol: 'http', hostname: '127.0.0.1', port: '9000', pathname: '/bakebay/**'},
            {protocol: 'http', hostname: 'localhost', pathname: '/**'},
            {protocol: 'http', hostname: '127.0.0.1', pathname: '/**'},
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    webpack: (config, {isServer}) => {
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                path: false,
                os: false,
            }
        }
        return config
    },
}

export default nextConfig
