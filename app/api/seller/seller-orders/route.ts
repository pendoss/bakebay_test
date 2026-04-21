import {NextResponse} from 'next/server'
import {eq, inArray} from 'drizzle-orm'
import {
    db,
    sellerStorageDrizzle,
    sellerOrders,
    sellerOrderItems,
    customerOrders,
    products,
    users,
} from '@/src/adapters/storage/drizzle'
import {asUserId} from '@/src/domain/shared/id'
import {getAuthPayload} from '@/app/api/get-auth'

export async function GET() {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const seller = await sellerStorageDrizzle().findByUserId(asUserId(auth.userId))
    if (!seller) return NextResponse.json({error: 'Seller profile required'}, {status: 403})

    const subs = await db
        .select()
        .from(sellerOrders)
        .where(eq(sellerOrders.seller_id, seller.id as unknown as number))

    if (subs.length === 0) return NextResponse.json([])

    const subIds = subs.map((s) => s.seller_order_id)
    const customerIds = Array.from(new Set(subs.map((s) => s.customer_order_id)))

    const [allItems, allRoots] = await Promise.all([
        db
            .select({
                itemId: sellerOrderItems.seller_order_item_id,
                sellerOrderId: sellerOrderItems.seller_order_id,
                productId: sellerOrderItems.product_id,
                quantity: sellerOrderItems.quantity,
                unitPrice: sellerOrderItems.unit_price,
                customizationDelta: sellerOrderItems.customization_delta,
                customizationThreadId: sellerOrderItems.customization_thread_id,
                productName: products.product_name,
            })
            .from(sellerOrderItems)
            .leftJoin(products, eq(sellerOrderItems.product_id, products.product_id))
            .where(inArray(sellerOrderItems.seller_order_id, subIds)),
        db
            .select({
                id: customerOrders.customer_order_id,
                address: customerOrders.address,
                createdAt: customerOrders.created_at,
                userId: customerOrders.user_id,
                firstName: users.first_name,
                lastName: users.last_name,
                email: users.email,
            })
            .from(customerOrders)
            .leftJoin(users, eq(customerOrders.user_id, users.user_id))
            .where(inArray(customerOrders.customer_order_id, customerIds)),
    ])

    const itemsBySub = new Map<number, typeof allItems>()
    for (const item of allItems) {
        const list = itemsBySub.get(item.sellerOrderId) ?? []
        list.push(item)
        itemsBySub.set(item.sellerOrderId, list)
    }
    const rootById = new Map(allRoots.map((r) => [r.id, r]))

    const result = subs.map((s) => {
        const root = rootById.get(s.customer_order_id)
        return {
            id: s.seller_order_id,
            customerOrderId: s.customer_order_id,
            status: s.status,
            stockCheck: s.stock_check,
            refundState: s.refund_state ?? 'none',
            refundReason: s.refund_reason ?? null,
            cancelReason: s.cancel_reason,
            createdAt: s.created_at,
            pricing: {
                subtotal: s.subtotal,
                customizationDelta: s.customization_delta,
                shipping: s.shipping,
                commissionRate: s.commission_rate_snapshot,
                commissionAmount: s.commission_amount,
                total: s.total,
            },
            customer: root
                ? {
                    name: `${root.firstName ?? ''} ${root.lastName ?? ''}`.trim() || root.email || 'Клиент',
                    email: root.email,
                    address: root.address,
                }
                : null,
            items: (itemsBySub.get(s.seller_order_id) ?? []).map((it) => ({
                id: it.itemId,
                productId: it.productId,
                name: it.productName ?? '',
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                customizationThreadId: it.customizationThreadId,
            })),
        }
    })

    return NextResponse.json(result)
}
