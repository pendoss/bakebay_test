import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    customizationStorageDrizzle,
    sellerOrderStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {asCustomizationOfferId, asCustomizationThreadId} from '@/src/domain/shared/id'
import {acceptCustomizationOffer} from '@/src/application/use-cases/customization'
import {syncSellerOrderFromThreadEvent} from '@/src/application/use-cases/seller-order'
import {
    CustomizationThreadClosedError,
    OfferNotFoundError,
    OfferSupersededError,
} from '@/src/domain/customization'
import {getAuthPayload} from '@/app/api/get-auth'
import {resolveSellerOrderByThread} from '@/app/api/customization/_lookup'
import {dispatchNotification, loadThreadParticipants} from '@/app/api/notifications/_dispatch'

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    const body = await request.json()
    const offerId = Number(body?.offerId)
    if (!offerId) return NextResponse.json({error: 'offerId required'}, {status: 400})

    try {
        await acceptCustomizationOffer(
            {
                threadId: asCustomizationThreadId(Number(id)),
                offerId: asCustomizationOfferId(offerId),
            },
            {customizationStorage: customizationStorageDrizzle()},
        )
        const sellerOrderId = await resolveSellerOrderByThread(Number(id))
        if (sellerOrderId !== null) {
            await syncSellerOrderFromThreadEvent(sellerOrderId, 'customer-accept', {
                sellerOrderStorage: sellerOrderStorageDrizzle(),
                customerOrderStorage: customerOrderStorageDrizzle(),
            })
        }
        const participants = await loadThreadParticipants(Number(id))
        if (participants) {
            await dispatchNotification({
                recipientUserId: participants.sellerUserId,
                kind: 'customer_accept',
                severity: 'success',
                titleMd: '**Клиент подтвердил оффер**',
                bodyMd: 'Финализируйте сделку, чтобы клиент смог оплатить позицию.',
                actions: [
                    {label: 'Открыть согласование', href: `/seller-dashboard/chats?thread=${id}`, style: 'primary'},
                ],
                meta: {threadId: Number(id), sellerOrderId: participants.sellerOrderId as unknown as number},
            })
        }
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof OfferNotFoundError) return NextResponse.json({error: err.message}, {status: 404})
        if (err instanceof OfferSupersededError) return NextResponse.json({error: err.message}, {status: 409})
        if (err instanceof CustomizationThreadClosedError) {
            return NextResponse.json({error: err.message}, {status: 409})
        }
        const msg = err instanceof Error ? err.message : 'accept failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
