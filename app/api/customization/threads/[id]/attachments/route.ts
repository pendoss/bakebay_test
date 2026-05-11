import {NextResponse} from 'next/server'
import {fileStorageS3} from '@/src/adapters/storage/s3/file-storage-s3'
import {getAuthPayload} from '@/app/api/get-auth'

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const MAX_BYTES = 8 * 1024 * 1024

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
        return NextResponse.json({error: 'file field required'}, {status: 400})
    }
    if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json({error: `Unsupported mime: ${file.type}`}, {status: 415})
    }
    if (file.size > MAX_BYTES) {
        return NextResponse.json({error: 'File too large (max 8 MB)'}, {status: 413})
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop() : file.type.split('/')[1]
    const key = `customization/${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    try {
        const url = await fileStorageS3().upload(key, file)
        return NextResponse.json({url})
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'upload failed'
        return NextResponse.json({error: msg}, {status: 500})
    }
}
