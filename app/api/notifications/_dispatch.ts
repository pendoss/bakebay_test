import 'server-only'
import {eq} from 'drizzle-orm'
import {
    customerOrders,
    db,
    notificationCenterDrizzle,
    sellerOrderItems,
    sellerOrders,
    sellers,
} from '@/src/adapters/storage/drizzle'
import {sharedEventEmitterBus} from '@/src/adapters/notifications/event-emitter-bus'
import {notifyRecipient} from '@/src/application/use-cases/notification'
import type {NotificationDraft} from '@/src/domain/notification'
import {asUserId, type SellerOrderId, type UserId} from '@/src/domain/shared/id'

export interface ThreadParticipants {
    readonly customerUserId: UserId
    readonly sellerUserId: UserId
    readonly sellerOrderId: SellerOrderId
}

export async function loadThreadParticipants(threadId: number): Promise<ThreadParticipants | null> {
    const rows = await db
        .select({
            sellerOrderId: sellerOrderItems.seller_order_id,
            sellerUserId: sellers.user_id,
            customerUserId: customerOrders.user_id,
        })
        .from(sellerOrderItems)
        .innerJoin(sellerOrders, eq(sellerOrderItems.seller_order_id, sellerOrders.seller_order_id))
        .innerJoin(sellers, eq(sellerOrders.seller_id, sellers.seller_id))
        .innerJoin(
            customerOrders,
            eq(sellerOrders.customer_order_id, customerOrders.customer_order_id),
        )
        .where(eq(sellerOrderItems.customization_thread_id, threadId))
    const row = rows[0]
    if (!row || row.customerUserId === null || row.sellerUserId === null) return null
    return {
        customerUserId: asUserId(row.customerUserId),
        sellerUserId: asUserId(row.sellerUserId),
        sellerOrderId: row.sellerOrderId as unknown as SellerOrderId,
    }
}

export async function loadSellerOrderParticipants(sellerOrderId: number): Promise<{
    sellerUserId: UserId
    customerUserId: UserId
} | null> {
    const rows = await db
        .select({
            sellerUserId: sellers.user_id,
            customerUserId: customerOrders.user_id,
        })
        .from(sellerOrders)
        .innerJoin(sellers, eq(sellerOrders.seller_id, sellers.seller_id))
        .innerJoin(
            customerOrders,
            eq(sellerOrders.customer_order_id, customerOrders.customer_order_id),
        )
        .where(eq(sellerOrders.seller_order_id, sellerOrderId))
    const row = rows[0]
    if (!row || row.customerUserId === null || row.sellerUserId === null) return null
    return {
        sellerUserId: asUserId(row.sellerUserId),
        customerUserId: asUserId(row.customerUserId),
    }
}

export async function dispatchNotification(draft: NotificationDraft): Promise<void> {
    await notifyRecipient(draft, {
        notificationCenter: notificationCenterDrizzle(),
        notificationBus: sharedEventEmitterBus(),
    })
}
