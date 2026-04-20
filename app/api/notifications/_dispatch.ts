import 'server-only'
import {and, eq, sql} from 'drizzle-orm'
import {
    customerOrders,
    db,
    notificationCenterDrizzle,
    notifications,
    sellerOrderItems,
    sellerOrders,
    sellers,
} from '@/src/adapters/storage/drizzle'
import {sharedEventEmitterBus} from '@/src/adapters/notifications/event-emitter-bus'
import {notifyRecipient} from '@/src/application/use-cases/notification'
import type {NotificationDraft, NotificationKind} from '@/src/domain/notification'
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

export interface DedupQuery {
    readonly recipientUserId: UserId
    readonly kind: NotificationKind
    readonly metaKey: string
    readonly metaValue: string
    readonly windowHours: number
}

export async function hasRecentNotification(query: DedupQuery): Promise<boolean> {
    const rows = await db
        .select({id: notifications.notification_id})
        .from(notifications)
        .where(
            and(
                eq(notifications.recipient_user_id, query.recipientUserId as unknown as number),
                eq(notifications.kind, query.kind),
                sql`${notifications.created_at} >= now() - (${query.windowHours} || ' hours')::interval`,
                sql`${notifications.meta} ->> ${query.metaKey} = ${query.metaValue}`,
            ),
        )
        .limit(1)
    return rows.length > 0
}
