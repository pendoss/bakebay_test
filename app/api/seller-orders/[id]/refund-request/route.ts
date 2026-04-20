import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {
    RefundOwnershipError,
    requestSellerOrderRefund,
    SellerOrderOwnershipError,
} from '@/src/application/use-cases/seller-order'
import {asSellerOrderId, asUserId} from '@/src/domain/shared/id'
import {
    RefundNotAllowedError,
    SellerOrderNotFoundError,
} from '@/src/domain/seller-order'
import {getAuthPayload} from '@/app/api/get-auth'
import {dispatchNotification, loadSellerOrderParticipants} from '@/app/api/notifications/_dispatch'

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    const body = await request.json().catch(() => ({}))
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    if (!reason) return NextResponse.json({error: 'reason required'}, {status: 400})

    const userId = asUserId(auth.userId)
    const seller = await sellerStorageDrizzle().findByUserId(userId)
    const actor: 'customer' | 'seller' = seller ? 'seller' : 'customer'

    try {
        await requestSellerOrderRefund(
            {
                sellerOrderId: asSellerOrderId(Number(id)),
                actor,
                actingUserId: userId,
                actingSellerId: seller?.id,
                reason,
            },
            {
                sellerOrderStorage: sellerOrderStorageDrizzle(),
                customerOrderStorage: customerOrderStorageDrizzle(),
            },
        )
        const participants = await loadSellerOrderParticipants(Number(id))
        if (participants) {
            const recipient = actor === 'seller' ? participants.customerUserId : participants.sellerUserId
            await dispatchNotification({
                recipientUserId: recipient,
                kind: 'refund_requested',
                severity: 'warning',
                titleMd: '**Запрошен возврат**',
                bodyMd: `Причина: ${reason}`,
                actions: [
                    {label: 'Открыть подзаказ', href: actor === 'seller' ? '/orders-v2' : '/seller-dashboard/orders-v2', style: 'primary'},
                ],
                meta: {sellerOrderId: Number(id)},
            })
        }
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof RefundOwnershipError || err instanceof SellerOrderOwnershipError) {
            return NextResponse.json({error: err.message}, {status: 403})
        }
        if (err instanceof SellerOrderNotFoundError) {
            return NextResponse.json({error: err.message}, {status: 404})
        }
        if (err instanceof RefundNotAllowedError) {
            return NextResponse.json({error: err.message}, {status: 409})
        }
        const msg = err instanceof Error ? err.message : 'refund failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
