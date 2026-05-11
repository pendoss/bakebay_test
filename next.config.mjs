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
        // Картинки товаров на S3 практически не меняются — кешируем оптимизированные
        // варианты на 30 дней. По умолчанию Next.js держит 60с, и если S3 отдаёт без
        // Cache-Control, каждое посещение страницы шлёт запрос к /_next/image и далее к S3.
        minimumCacheTTL: 60 * 60 * 24 * 30,
        formats: ['image/avif', 'image/webp'],
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
