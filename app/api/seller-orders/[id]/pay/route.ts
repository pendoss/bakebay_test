import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    sellerOrderStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {asSellerOrderId, asUserId} from '@/src/domain/shared/id'
import {paySellerOrder, SellerOrderAccessDeniedError} from '@/src/application/use-cases/seller-order'
import {
    InvalidSellerOrderTransitionError,
    SellerOrderNotFoundError,
} from '@/src/domain/seller-order'
import {getAuthPayload} from '@/app/api/get-auth'

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    // Заглушка: читаем тело, но не валидируем PAN / CVV — в будущем здесь будет вызов платёжного шлюза.
    await request.json().catch(() => ({}))

    try {
        const result = await paySellerOrder(
            {
                sellerOrderId: asSellerOrderId(Number(id)),
                payingUserId: asUserId(auth.userId),
            },
            {
                sellerOrderStorage: sellerOrderStorageDrizzle(),
                customerOrderStorage: customerOrderStorageDrizzle(),
            },
        )
        return NextResponse.json({
            ok: true,
            sellerOrderId: result.sellerOrderId as unknown as number,
            amount: result.amount,
            paidAt: result.paidAt,
        })
    } catch (err) {
        if (err instanceof SellerOrderAccessDeniedError) {
            return NextResponse.json({error: err.message}, {status: 403})
        }
        if (err instanceof SellerOrderNotFoundError) {
            return NextResponse.json({error: err.message}, {status: 404})
        }
        if (err instanceof InvalidSellerOrderTransitionError) {
            return NextResponse.json({error: err.message}, {status: 409})
        }
        const msg = err instanceof Error ? err.message : 'payment failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
