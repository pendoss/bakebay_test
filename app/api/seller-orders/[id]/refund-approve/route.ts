import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    ingredientReservationStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {
    approveSellerOrderRefund,
    SellerOrderOwnershipError,
} from '@/src/application/use-cases/seller-order'
import {asSellerOrderId, asUserId} from '@/src/domain/shared/id'
import {SellerOrderNotFoundError} from '@/src/domain/seller-order'
import {getAuthPayload} from '@/app/api/get-auth'

export async function POST(_request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    if (!seller) return NextResponse.json({error: 'Seller profile required'}, {status: 403})

    const {id} = await params
    const sellerOrderId = asSellerOrderId(Number(id))
    const sellerOrderStorage = sellerOrderStorageDrizzle()
    const order = await sellerOrderStorage.findById(sellerOrderId)
    if (!order) return NextResponse.json({error: 'not found'}, {status: 404})
    if (order.sellerId !== seller.id) {
        return NextResponse.json({error: 'forbidden'}, {status: 403})
    }

    try {
        await approveSellerOrderRefund(
            {sellerOrderId},
            {
                sellerOrderStorage,
                customerOrderStorage: customerOrderStorageDrizzle(),
                reservationStorage: ingredientReservationStorageDrizzle(),
            },
        )
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof SellerOrderOwnershipError) return NextResponse.json({error: err.message}, {status: 403})
        if (err instanceof SellerOrderNotFoundError) return NextResponse.json({error: err.message}, {status: 404})
        const msg = err instanceof Error ? err.message : 'approve failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
