import {NextResponse} from 'next/server'
import {
    customerOrderStorageDrizzle,
    customizationStorageDrizzle,
    sellerOrderStorageDrizzle,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {asCustomizationThreadId, asUserId} from '@/src/domain/shared/id'
import {postCustomizationMessage, ThreadNotFoundError} from '@/src/application/use-cases/customization'
import {syncSellerOrderFromThreadEvent} from '@/src/application/use-cases/seller-order'
import {CustomizationThreadClosedError, type MessageAuthor} from '@/src/domain/customization'
import {getAuthPayload} from '@/app/api/get-auth'
import {resolveSellerOrderByThread} from '@/app/api/customization/_lookup'
import {dispatchNotification, loadThreadParticipants} from '@/app/api/notifications/_dispatch'

async function notifyThreadMessage(threadId: number, author: MessageAuthor, bodyText: string) {
    const participants = await loadThreadParticipants(threadId)
    if (!participants) return

    const isSellerAuthor = author === 'seller'
    const recipientUserId = isSellerAuthor ? participants.customerUserId : participants.sellerUserId
    const inboxBase = isSellerAuthor ? '/chats' : '/seller-dashboard/chats'
    const titleMd = isSellerAuthor ? '**Сообщение от продавца**' : '**Сообщение от клиента**'
    const bodyMd = bodyText.length > 280 ? `${bodyText.slice(0, 277)}…` : bodyText

    await dispatchNotification({
        recipientUserId,
        kind: 'chat_message',
        severity: 'info',
        titleMd,
        bodyMd,
        actions: [
            {label: 'Открыть согласование', href: `${inboxBase}?thread=${threadId}`, style: 'primary'},
        ],
        meta: {threadId, sellerOrderId: participants.sellerOrderId as unknown as number},
    })
}

export async function POST(request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    const body = await request.json()
    const bodyText = String(body?.body ?? '').trim()
    const attachmentUrls = Array.isArray(body?.attachmentUrls) ? body.attachmentUrls.map(String) : []
    if (!bodyText && attachmentUrls.length === 0) {
        return NextResponse.json({error: 'Message body or attachment required'}, {status: 400})
    }

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    const author: MessageAuthor = seller ? 'seller' : 'customer'

    try {
        await postCustomizationMessage(
            {
                threadId: asCustomizationThreadId(Number(id)),
                author,
                body: bodyText,
                attachmentUrls,
            },
            {customizationStorage: customizationStorageDrizzle()},
        )
        const sellerOrderId = await resolveSellerOrderByThread(Number(id))
        if (sellerOrderId !== null) {
            await syncSellerOrderFromThreadEvent(
                sellerOrderId,
                author === 'seller' ? 'seller-message' : 'customer-message',
                {
                    sellerOrderStorage: sellerOrderStorageDrizzle(),
                    customerOrderStorage: customerOrderStorageDrizzle(),
                },
            )
        }
        await notifyThreadMessage(Number(id), author, bodyText)
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof ThreadNotFoundError) return NextResponse.json({error: err.message}, {status: 404})
        if (err instanceof CustomizationThreadClosedError) {
            return NextResponse.json({error: err.message}, {status: 409})
        }
        const msg = err instanceof Error ? err.message : 'post failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
