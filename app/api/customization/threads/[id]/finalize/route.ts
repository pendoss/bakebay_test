import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    customizationStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {asCustomizationThreadId, asUserId} from '@/src/domain/shared/id'
import {finalizeCustomizationAgreement, ThreadNotFoundError} from '@/src/application/use-cases/customization'
import {syncSellerOrderFromThreadEvent} from '@/src/application/use-cases/seller-order'
import {
    CustomizationThreadClosedError,
    NoActiveOfferError,
} from '@/src/domain/customization'
import {getAuthPayload} from '@/app/api/get-auth'
import {resolveSellerOrderByThread} from '@/app/api/customization/_lookup'
import {dispatchNotification, loadThreadParticipants} from '@/app/api/notifications/_dispatch'

export async function POST(_request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    if (!seller) return NextResponse.json({error: 'Only sellers can finalize'}, {status: 403})

    const {id} = await params
    try {
        await finalizeCustomizationAgreement(
            {threadId: asCustomizationThreadId(Number(id))},
            {customizationStorage: customizationStorageDrizzle()},
        )
        const sellerOrderId = await resolveSellerOrderByThread(Number(id))
        if (sellerOrderId !== null) {
            await syncSellerOrderFromThreadEvent(sellerOrderId, 'seller-finalize', {
                sellerOrderStorage: sellerOrderStorageDrizzle(),
                customerOrderStorage: customerOrderStorageDrizzle(),
            })
        }
        const participants = await loadThreadParticipants(Number(id))
        if (participants) {
            await dispatchNotification({
                recipientUserId: participants.customerUserId,
                kind: 'chat_finalized',
                severity: 'success',
                titleMd: '**Подзаказ подтверждён продавцом**',
                bodyMd: 'Можно оплатить позицию — продавец зафиксировал условия.',
                actions: [
                    {label: 'Перейти к оплате', href: '/orders-v2', style: 'primary'},
                ],
                meta: {threadId: Number(id), sellerOrderId: participants.sellerOrderId as unknown as number},
            })
        }
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof ThreadNotFoundError) return NextResponse.json({error: err.message}, {status: 404})
        if (err instanceof CustomizationThreadClosedError)
            return NextResponse.json({error: err.message}, {status: 409})
        if (err instanceof NoActiveOfferError) return NextResponse.json({error: err.message}, {status: 409})
        const msg = err instanceof Error ? err.message : 'finalize failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
