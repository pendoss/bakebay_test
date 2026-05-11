const DEFAULT_FALLBACK = '/placeholder.svg'

function readEnv(name: string): string | undefined {
    const publicName = `NEXT_PUBLIC_${name}`
    const fromPublic = process.env[publicName]
    if (fromPublic) return fromPublic
    return process.env[name]
}

function composeHost(endpoint: string, port: string | undefined): string {
    if (endpoint.includes(':')) return endpoint
    if (!port || port === '80' || port === '443') return endpoint
    return `${endpoint}:${port}`
}

function baseUrl(): string | null {
    const explicit = readEnv('S3_PUBLIC_URL')
    if (explicit) return explicit.replace(/\/+$/, '')

    const endpoint = readEnv('S3_ENDPOINT')
    const bucket = readEnv('S3_BUCKET_NAME')
    if (!endpoint || !bucket) return null

    const useSsl = readEnv('S3_USE_SSL')
    const protocol = useSsl === 'false' ? 'http' : 'https'
    const host = composeHost(endpoint, readEnv('S3_PORT'))
    return `${protocol}://${host}/${bucket}`
}

export function publicS3Url(key: string, fallback: string = DEFAULT_FALLBACK): string {
    const base = baseUrl()
    if (!base) return fallback
    const cleanKey = key.replace(/^\/+/, '')
    return `${base}/${cleanKey}`
}
