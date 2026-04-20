import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    customizationStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {asCustomizationThreadId, asUserId} from '@/src/domain/shared/id'
import {postCustomizationMessage, ThreadNotFoundError} from '@/src/application/use-cases/customization'
import {syncSellerOrderFromThreadEvent} from '@/src/application/use-cases/seller-order'
import {CustomizationThreadClosedError, type MessageAuthor} from '@/src/domain/customization'
import {getAuthPayload} from '@/app/api/get-auth'
import {resolveSellerOrderByThread} from '@/app/api/customization/_lookup'

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    const body = await request.json()
    const bodyText = String(body?.body ?? '').trim()
    const attachmentUrls = Array.isArray(body?.attachmentUrls) ? body.attachmentUrls.map(String) : []
    if (!bodyText && attachmentUrls.length === 0) {
        return NextResponse.json({error: 'Message body or attachment required'}, {status: 400})
    }

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    const author: MessageAuthor = seller ? 'seller' : 'customer'

    try {
        await postCustomizationMessage(
            {
                threadId: asCustomizationThreadId(Number(id)),
                author,
                body: bodyText,
                attachmentUrls,
            },
            {customizationStorage: customizationStorageDrizzle()},
        )
        const sellerOrderId = await resolveSellerOrderByThread(Number(id))
        if (sellerOrderId !== null) {
            await syncSellerOrderFromThreadEvent(
                sellerOrderId,
                author === 'seller' ? 'seller-message' : 'customer-message',
                {
                    sellerOrderStorage: sellerOrderStorageDrizzle(),
                    customerOrderStorage: customerOrderStorageDrizzle(),
                },
            )
        }
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof ThreadNotFoundError) return NextResponse.json({error: err.message}, {status: 404})
        if (err instanceof CustomizationThreadClosedError) {
            return NextResponse.json({error: err.message}, {status: 409})
        }
        const msg = err instanceof Error ? err.message : 'post failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
