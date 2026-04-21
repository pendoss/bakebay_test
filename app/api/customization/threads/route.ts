import {NextResponse} from 'next/server'
import {eq, inArray, desc} from 'drizzle-orm'
import {
    db,
    customizationThreads,
    customizationMessages,
    sellerOrderItems,
    sellerOrders,
    sellers,
    customerOrders,
    products,
    users,
    sellerStorageDrizzle,
} from '@/src/adapters/storage/drizzle'
import {asUserId} from '@/src/domain/shared/id'
import {getAuthPayload} from '@/app/api/get-auth'

export async function GET() {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    const viewerRole: 'seller' | 'customer' = seller ? 'seller' : 'customer'

    const items = await db
        .select({
            itemId: sellerOrderItems.seller_order_item_id,
            sellerOrderId: sellerOrderItems.seller_order_id,
            productName: products.product_name,
            quantity: sellerOrderItems.quantity,
            threadId: sellerOrderItems.customization_thread_id,
            sellerId: sellerOrders.seller_id,
            sellerName: sellers.seller_name,
            customerOrderId: sellerOrders.customer_order_id,
            subStatus: sellerOrders.status,
            customerUserId: customerOrders.user_id,
            customerFirst: users.first_name,
            customerLast: users.last_name,
            customerEmail: users.email,
        })
        .from(sellerOrderItems)
        .innerJoin(sellerOrders, eq(sellerOrderItems.seller_order_id, sellerOrders.seller_order_id))
        .innerJoin(customerOrders, eq(sellerOrders.customer_order_id, customerOrders.customer_order_id))
        .leftJoin(products, eq(sellerOrderItems.product_id, products.product_id))
        .leftJoin(sellers, eq(sellerOrders.seller_id, sellers.seller_id))
        .leftJoin(users, eq(customerOrders.user_id, users.user_id))

    const sellerIdNumeric = seller ? (seller.id as unknown as number) : null
    const filtered = items.filter((it) => {
        if (it.threadId === null) return false
        if (viewerRole === 'seller') return it.sellerId === sellerIdNumeric
        return it.customerUserId === auth.userId
    })
    if (filtered.length === 0) {
        return NextResponse.json({
            viewerRole,
            threads: [],
            viewerSellerName: seller?.name ?? null,
        })
    }

    const threadIds = filtered.map((i) => i.threadId as number)

    const [threadHeaders, lastMessagesRaw] = await Promise.all([
        db
            .select()
            .from(customizationThreads)
            .where(inArray(customizationThreads.customization_thread_id, threadIds)),
        db
            .select()
            .from(customizationMessages)
            .where(inArray(customizationMessages.thread_id, threadIds))
            .orderBy(desc(customizationMessages.created_at)),
    ])

    const lastByThread = new Map<number, typeof lastMessagesRaw[number]>()
    for (const m of lastMessagesRaw) {
        if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m)
    }
    const headerByThread = new Map(threadHeaders.map((h) => [h.customization_thread_id, h]))

    const threads = filtered.map((item) => {
        const header = headerByThread.get(item.threadId as number)
        const last = lastByThread.get(item.threadId as number) ?? null
        const customerName =
            `${item.customerFirst ?? ''} ${item.customerLast ?? ''}`.trim() ||
            item.customerEmail ||
            'Клиент'
        return {
            threadId: item.threadId as number,
            sellerOrderId: item.sellerOrderId,
            sellerOrderItemId: item.itemId,
            productName: item.productName ?? '(без названия)',
            quantity: item.quantity,
            status: header?.status ?? 'open',
            sellerOrderStatus: item.subStatus,
            counterpart: viewerRole === 'seller' ? customerName : (item.sellerName ?? `Продавец #${item.sellerId}`),
            lastMessage: last
                ? {
                    author: last.author,
                    body: last.body,
                    hasAttachments: Array.isArray(last.attachment_urls) && last.attachment_urls.length > 0,
                    createdAt: last.created_at,
                }
                : null,
            updatedAt: header?.updated_at ?? null,
        }
    })

    threads.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.updatedAt ?? new Date(0)
        const bTime = b.lastMessage?.createdAt ?? b.updatedAt ?? new Date(0)
        return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    return NextResponse.json({
        viewerRole,
        threads,
        viewerSellerName: seller?.name ?? null,
    })
}
