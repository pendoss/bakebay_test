import {eq} from 'drizzle-orm'
import {db, sellerOrderItems} from '@/src/adapters/storage/drizzle'
import {asSellerOrderId} from '@/src/domain/shared/id'
import type {SellerOrderId} from '@/src/domain/shared/id'

export async function resolveSellerOrderByThread(threadId: number): Promise<SellerOrderId | null> {
    const [row] = await db
        .select({sellerOrderId: sellerOrderItems.seller_order_id})
        .from(sellerOrderItems)
        .where(eq(sellerOrderItems.customization_thread_id, threadId))
    if (!row) return null
    return asSellerOrderId(row.sellerOrderId)
}
