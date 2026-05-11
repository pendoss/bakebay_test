import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    customizationStorageDrizzle,
    sellerOrderStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {asCustomizationThreadId} from '@/src/domain/shared/id'
import {requestCustomizationRevision} from '@/src/application/use-cases/customization'
import {syncSellerOrderFromThreadEvent} from '@/src/application/use-cases/seller-order'
import {
    CustomizationThreadClosedError,
    NoActiveOfferError,
} from '@/src/domain/customization'
import {getAuthPayload} from '@/app/api/get-auth'
import {resolveSellerOrderByThread} from '@/app/api/customization/_lookup'

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    const body = await request.json().catch(() => ({}))
    const note = typeof body?.note === 'string' ? body.note : undefined

    try {
        await requestCustomizationRevision(
            {threadId: asCustomizationThreadId(Number(id)), note},
            {customizationStorage: customizationStorageDrizzle()},
        )
        const sellerOrderId = await resolveSellerOrderByThread(Number(id))
        if (sellerOrderId !== null) {
            await syncSellerOrderFromThreadEvent(sellerOrderId, 'customer-revision', {
                sellerOrderStorage: sellerOrderStorageDrizzle(),
                customerOrderStorage: customerOrderStorageDrizzle(),
            })
        }
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof NoActiveOfferError) return NextResponse.json({error: err.message}, {status: 409})
        if (err instanceof CustomizationThreadClosedError) {
            return NextResponse.json({error: err.message}, {status: 409})
        }
        const msg = err instanceof Error ? err.message : 'revision failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
