import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    ingredientReservationStorageDrizzle,
    ingredientStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {
    advanceSellerOrderStatus,
    SellerOrderOwnershipError,
} from '@/src/application/use-cases/seller-order'
import {asSellerOrderId, asUserId} from '@/src/domain/shared/id'
import {
    InvalidSellerOrderTransitionError,
    SellerOrderNotFoundError,
    type SellerOrderStatus,
} from '@/src/domain/seller-order'
import {getAuthPayload} from '@/app/api/get-auth'

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    if (!seller) return NextResponse.json({error: 'Seller profile required'}, {status: 403})

    const {id} = await params
    const body = await request.json()
    const next = body?.next as SellerOrderStatus | undefined
    if (!next) return NextResponse.json({error: 'next status required'}, {status: 400})

    try {
        await advanceSellerOrderStatus(
            {
                sellerOrderId: asSellerOrderId(Number(id)),
                actingSellerId: seller.id,
                next,
            },
            {
                sellerOrderStorage: sellerOrderStorageDrizzle(),
                customerOrderStorage: customerOrderStorageDrizzle(),
                stock: {
                    ingredientStorage: ingredientStorageDrizzle(),
                    reservationStorage: ingredientReservationStorageDrizzle(),
                },
            },
        )
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof SellerOrderOwnershipError) {
            return NextResponse.json({error: err.message}, {status: 403})
        }
        if (err instanceof SellerOrderNotFoundError) {
            return NextResponse.json({error: err.message}, {status: 404})
        }
        if (err instanceof InvalidSellerOrderTransitionError) {
            return NextResponse.json({error: err.message}, {status: 409})
        }
        const msg = err instanceof Error ? err.message : 'transition failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
