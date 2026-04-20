import {NextResponse} from 'next/server'
import {eq} from 'drizzle-orm'
import {
    customerOrderStorageDrizzle,
    customizationStorageDrizzle,
    db,
    productLookupDrizzle,
    sellerCommissionLookupDrizzle,
    sellerOrders,
    sellerOrderItems,
    sellers,
    products,
    customerOrders,
} from '@/src/adapters/storage/drizzle'
import {checkout} from '@/src/application/use-cases/customer-order'
import {asProductId, asUserId} from '@/src/domain/shared/id'
import {getAuthPayload} from '@/app/api/get-auth'

export async function POST(request: Request) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const body = await request.json()
    const rawLines = Array.isArray(body?.lines) ? body.lines : null
    if (!rawLines) return NextResponse.json({error: 'lines required'}, {status: 400})

    try {
        const result = await checkout(
            {
                userId: asUserId(auth.userId),
                address: String(body.address ?? ''),
                paymentMethod: String(body.paymentMethod ?? 'card'),
                lines: rawLines.map(
                    (l: {
                        productId: number
                        quantity: number
                        optionValueIds?: number[]
                        customerNote?: string
                        optionSelectionsSummary?: Array<{ groupName: string; label: string }>
                        customizationDelta?: number
                    }) => ({
                        productId: asProductId(Number(l.productId)),
                        quantity: Number(l.quantity),
                        optionValueIds: Array.isArray(l.optionValueIds) ? l.optionValueIds.map(Number) : undefined,
                        customerNote: typeof l.customerNote === 'string' ? l.customerNote : undefined,
                        optionSelectionsSummary: Array.isArray(l.optionSelectionsSummary)
                            ? l.optionSelectionsSummary
                            : undefined,
                        customizationDelta:
                            typeof l.customizationDelta === 'number' ? l.customizationDelta : undefined,
                    }),
                ),
                shippingPerSeller: body.shippingPerSeller ? Number(body.shippingPerSeller) : 0,
            },
            {
                customerOrderStorage: customerOrderStorageDrizzle(),
                productLookup: productLookupDrizzle(),
                commissionLookup: sellerCommissionLookupDrizzle(),
                customizationStorage: customizationStorageDrizzle(),
            },
        )
        return NextResponse.json({
            customerOrderId: result.customerOrderId as unknown as number,
            sellerOrderIds: result.sellerOrderIds.map((id) => id as unknown as number),
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'checkout failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}

export async function GET() {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const roots = await db
        .select()
        .from(customerOrders)
        .where(eq(customerOrders.user_id, auth.userId))

    const result = await Promise.all(
        roots.map(async (root) => {
            const subs = await db
                .select({
                    seller_order_id: sellerOrders.seller_order_id,
                    customer_order_id: sellerOrders.customer_order_id,
                    seller_id: sellerOrders.seller_id,
                    status: sellerOrders.status,
                    subtotal: sellerOrders.subtotal,
                    customization_delta: sellerOrders.customization_delta,
                    shipping: sellerOrders.shipping,
                    commission_rate_snapshot: sellerOrders.commission_rate_snapshot,
                    commission_amount: sellerOrders.commission_amount,
                    total: sellerOrders.total,
                    stock_check: sellerOrders.stock_check,
                    cancel_reason: sellerOrders.cancel_reason,
                    sellerName: sellers.seller_name,
                })
                .from(sellerOrders)
                .leftJoin(sellers, eq(sellerOrders.seller_id, sellers.seller_id))
                .where(eq(sellerOrders.customer_order_id, root.customer_order_id))

            const subWithItems = await Promise.all(
                subs.map(async (s) => {
                    const items = await db
                        .select({
                            itemId: sellerOrderItems.seller_order_item_id,
                            productId: sellerOrderItems.product_id,
                            quantity: sellerOrderItems.quantity,
                            unitPrice: sellerOrderItems.unit_price,
                            productName: products.product_name,
                            customizationThreadId: sellerOrderItems.customization_thread_id,
                        })
                        .from(sellerOrderItems)
                        .leftJoin(products, eq(sellerOrderItems.product_id, products.product_id))
                        .where(eq(sellerOrderItems.seller_order_id, s.seller_order_id))
                    return {
                        id: s.seller_order_id,
                        sellerId: s.seller_id,
                        sellerName: s.sellerName ?? null,
                        status: s.status,
                        stockCheck: s.stock_check,
                        pricing: {
                            subtotal: s.subtotal,
                            customizationDelta: s.customization_delta,
                            shipping: s.shipping,
                            commissionRate: s.commission_rate_snapshot,
                            commissionAmount: s.commission_amount,
                            total: s.total,
                        },
                        cancelReason: s.cancel_reason,
                        items: items.map((i) => ({
                            id: i.itemId,
                            productId: i.productId,
                            name: i.productName ?? '',
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            customizationThreadId: i.customizationThreadId,
                        })),
                    }
                }),
            )
            return {
                id: root.customer_order_id,
                derivedStatus: root.derived_status,
                address: root.address,
                paymentMethod: root.payment_method,
                createdAt: root.created_at,
                sellerOrders: subWithItems,
            }
        }),
    )

    return NextResponse.json(result)
}
