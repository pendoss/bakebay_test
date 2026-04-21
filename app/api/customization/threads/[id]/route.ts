import {NextResponse} from 'next/server'
import {customizationStorageDrizzle} from '@/src/adapters/storage/drizzle'
import {asCustomizationThreadId} from '@/src/domain/shared/id'
import {getAuthPayload} from '@/app/api/get-auth'

export async function GET(_request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    const thread = await customizationStorageDrizzle().findThread(asCustomizationThreadId(Number(id)))
    if (!thread) return NextResponse.json({error: 'Not found'}, {status: 404})

    return NextResponse.json({
        id: thread.id as unknown as number,
        sellerOrderItemId: thread.sellerOrderItemId as unknown as number,
        status: thread.status,
        agreedOfferId: thread.agreedOfferId !== null ? (thread.agreedOfferId as unknown as number) : null,
        offers: thread.offers.map((o) => ({
            id: o.id as unknown as number,
            version: o.version,
            priceDelta: o.priceDelta,
            spec: o.spec,
            createdAt: o.createdAt,
            supersededByOfferId:
                o.supersededByOfferId !== null ? (o.supersededByOfferId as unknown as number) : null,
        })),
        messages: thread.messages.map((m) => ({
            id: m.id as unknown as number,
            author: m.author,
            body: m.body,
            attachmentUrls: m.attachmentUrls,
            createdAt: m.createdAt,
        })),
    })
}
