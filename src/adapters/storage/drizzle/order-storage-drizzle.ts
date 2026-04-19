import {eq, inArray} from 'drizzle-orm'
import {db, orders, orderItems, products, productIngredients} from '@/src/adapters/storage/drizzle'
import type {OrderStorage, OrderListFilters, OrderDraft} from '@/src/application/ports/order-storage'
import type {Order, OrderItem, OrderItemIngredient, OrderStatus} from '@/src/domain/order'
import type {OrderId} from '@/src/domain/shared/id'
import {asOrderId, asOrderItemId, asProductId, asUserId} from '@/src/domain/shared/id'

export function orderStorageDrizzle(): OrderStorage {
    return {
        async findById(id: OrderId): Promise<Order | null> {
            const list = await this.listByIds([id])
            return list[0] ?? null
        },

        async listIds(filters: OrderListFilters): Promise<OrderId[]> {
            if (filters.sellerId) {
                const rows = await db
                    .selectDistinct({orderId: orders.order_id})
                    .from(orders)
                    .leftJoin(orderItems, eq(orders.order_id, orderItems.order_id))
                    .leftJoin(products, eq(orderItems.product_id, products.product_id))
                    .where(eq(products.seller_id, filters.sellerId as unknown as number))
                return rows.map((r) => asOrderId(r.orderId as number))
            }
            if (filters.userId) {
                const rows = await db
                    .select({orderId: orders.order_id})
                    .from(orders)
                    .where(eq(orders.user_id, filters.userId as unknown as number))
                return rows.map((r) => asOrderId(r.orderId))
            }
            const rows = await db.select({orderId: orders.order_id}).from(orders)
            return rows.map((r) => asOrderId(r.orderId))
        },

        async listByIds(ids: OrderId[]): Promise<Order[]> {
            if (ids.length === 0) return []
            const numericIds = ids.map((i) => i as unknown as number)
            const headers = await db
                .select()
                .from(orders)
                .where(inArray(orders.order_id, numericIds))

            const rows = await db
                .select({
                    orderId: orders.order_id,
                    orderItemId: orderItems.order_item_id,
                    productId: orderItems.product_id,
                    quantity: orderItems.quantity,
                    productName: products.product_name,
                    ingredientName: productIngredients.name,
                    ingredientAmount: productIngredients.amount,
                    ingredientUnit: productIngredients.unit,
                })
                .from(orders)
                .leftJoin(orderItems, eq(orders.order_id, orderItems.order_id))
                .leftJoin(products, eq(orderItems.product_id, products.product_id))
                .leftJoin(productIngredients, eq(products.product_id, productIngredients.product_id))
                .where(inArray(orders.order_id, numericIds))

            const itemsByOrder = new Map<number, Map<number, OrderItem>>()
            for (const row of rows) {
                if (row.orderId === null || row.orderItemId === null) continue
                let itemsMap = itemsByOrder.get(row.orderId)
                if (!itemsMap) {
                    itemsMap = new Map()
                    itemsByOrder.set(row.orderId, itemsMap)
                }
                let item = itemsMap.get(row.orderItemId)
                if (!item) {
                    item = {
                        id: asOrderItemId(row.orderItemId),
                        productId: row.productId !== null ? asProductId(row.productId) : null,
                        name: row.productName ?? '',
                        quantity: row.quantity ?? 1,
                        ingredients: [],
                    }
                    itemsMap.set(row.orderItemId, item)
                }
                if (row.ingredientName && !item.ingredients.some((i) => i.name === row.ingredientName)) {
                    const ing: OrderItemIngredient = {
                        name: row.ingredientName,
                        amount: row.ingredientAmount ?? 0,
                        unit: row.ingredientUnit ?? '',
                    }
                    item.ingredients.push(ing)
                }
            }

            return headers.map<Order>((h) => ({
                id: asOrderId(h.order_id),
                userId: h.user_id !== null ? asUserId(h.user_id) : null,
                status: (h.order_status ?? 'ordering') as OrderStatus,
                totalPrice: h.total_price ?? 0,
                address: h.address,
                paymentMethod: h.payment_method,
                date: h.date,
                items: Array.from(itemsByOrder.get(h.order_id)?.values() ?? []),
            }))
        },

        async create(draft: OrderDraft, totalPrice: number): Promise<OrderId> {
            const [inserted] = await db
                .insert(orders)
                .values({
                    date: new Date(),
                    order_status: 'ordering',
                    user_id: draft.userId !== null ? (draft.userId as unknown as number) : null,
                    total_price: totalPrice,
                    address: draft.address,
                    payment_method: draft.paymentMethod,
                })
                .returning({id: orders.order_id})
            const orderId = inserted.id
            if (draft.items.length > 0) {
                await db.insert(orderItems).values(
                    draft.items.map((it) => ({
                        order_id: orderId,
                        product_id: it.productId,
                        quantity: it.quantity,
                    })),
                )
            }
            return asOrderId(orderId)
        },

        async updateStatus(id: OrderId, status: OrderStatus): Promise<boolean> {
            const res = await db
                .update(orders)
                .set({order_status: status})
                .where(eq(orders.order_id, id as unknown as number))
                .returning({id: orders.order_id})
            return res.length > 0
        },
    }
}
