import {NextResponse} from 'next/server'
import {
    ingredientReservationStorageDrizzle,
    ingredientStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {checkSellerOrderStock} from '@/src/application/use-cases/seller-order'
import {asSellerOrderId, asUserId} from '@/src/domain/shared/id'
import {SellerOrderNotFoundError} from '@/src/domain/seller-order'
import {getAuthPayload} from '@/app/api/get-auth'

export async function GET(_request: Request, {params}: { params: Promise<{ id: string }> }) {
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
        const report = await checkSellerOrderStock(
            {sellerOrderId},
            {
                sellerOrderStorage,
                ingredientStorage: ingredientStorageDrizzle(),
                reservationStorage: ingredientReservationStorageDrizzle(),
            },
        )
        return NextResponse.json(report)
    } catch (err) {
        if (err instanceof SellerOrderNotFoundError) {
            return NextResponse.json({error: err.message}, {status: 404})
        }
        const msg = err instanceof Error ? err.message : 'stock report failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
