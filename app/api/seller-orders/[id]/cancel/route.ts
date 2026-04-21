import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    ingredientReservationStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {cancelSellerOrder, SellerOrderOwnershipError} from '@/src/application/use-cases/seller-order'
import {asSellerOrderId, asUserId} from '@/src/domain/shared/id'
import {
    CancellationNotAllowedError,
    SellerOrderNotFoundError,
} from '@/src/domain/seller-order'
import {getAuthPayload} from '@/app/api/get-auth'

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    const body = await request.json().catch(() => ({}))
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    if (!reason) return NextResponse.json({error: 'reason required'}, {status: 400})

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    const actor: 'customer' | 'seller' = seller ? 'seller' : 'customer'

    try {
        await cancelSellerOrder(
            {
                sellerOrderId: asSellerOrderId(Number(id)),
                actor,
                actingSellerId: seller?.id,
                reason,
            },
            {
                sellerOrderStorage: sellerOrderStorageDrizzle(),
                customerOrderStorage: customerOrderStorageDrizzle(),
                reservationStorage: ingredientReservationStorageDrizzle(),
            },
        )
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof SellerOrderOwnershipError) return NextResponse.json({error: err.message}, {status: 403})
        if (err instanceof SellerOrderNotFoundError) return NextResponse.json({error: err.message}, {status: 404})
        if (err instanceof CancellationNotAllowedError) return NextResponse.json({error: err.message}, {status: 409})
        const msg = err instanceof Error ? err.message : 'cancel failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
