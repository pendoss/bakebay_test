import {eq} from 'drizzle-orm'
import {
    db,
    customerOrders,
    sellerOrders,
    sellerOrderItems,
    sellerOrderItemOptionSelections,
} from '@/src/adapters/storage/drizzle'
import type {
    CreateCustomerOrderResult,
    CustomerOrderDraft,
    CustomerOrderStorage,
    SellerOrderDraft,
    SellerOrderStorage,
} from '@/src/application/ports/customer-order-storage'
import type {CustomerOrder, CustomerOrderDerivedStatus} from '@/src/domain/customer-order'
import {
    asCustomerOrderId,
    asSellerId,
    asSellerOrderId,
    asSellerOrderItemId,
    asProductId,
    asUserId,
} from '@/src/domain/shared/id'
import type {CustomerOrderId, SellerId, SellerOrderId, UserId} from '@/src/domain/shared/id'
import type {SellerOrder, SellerOrderStatus, StockOverall} from '@/src/domain/seller-order'
import {calcPricing} from '@/src/domain/seller-order'

function toCustomerOrder(row: typeof customerOrders.$inferSelect, subIds: ReadonlyArray<number>): CustomerOrder {
    return {
        id: asCustomerOrderId(row.customer_order_id),
        userId: asUserId(row.user_id),
        derivedStatus: row.derived_status as CustomerOrderDerivedStatus,
        address: row.address,
        createdAt: row.created_at,
        sellerOrderIds: subIds.map((id) => asSellerOrderId(id)),
    }
}

export function customerOrderStorageDrizzle(): CustomerOrderStorage {
    return {
        async findById(id: CustomerOrderId) {
            const [header] = await db
                .select()
                .from(customerOrders)
                .where(eq(customerOrders.customer_order_id, id as unknown as number))
            if (!header) return null
            const subs = await db
                .select({id: sellerOrders.seller_order_id})
                .from(sellerOrders)
                .where(eq(sellerOrders.customer_order_id, header.customer_order_id))
            return toCustomerOrder(header, subs.map((s) => s.id))
        },

        async listByUser(userId: UserId) {
            const headers = await db
                .select()
                .from(customerOrders)
                .where(eq(customerOrders.user_id, userId as unknown as number))
            if (headers.length === 0) return []
            const ids = headers.map((h) => h.customer_order_id)
            const subs = await db.select().from(sellerOrders)
            const subMap = new Map<number, number[]>()
            for (const s of subs) {
                if (!ids.includes(s.customer_order_id)) continue
                const list = subMap.get(s.customer_order_id) ?? []
                list.push(s.seller_order_id)
                subMap.set(s.customer_order_id, list)
            }
            return headers.map((h) => toCustomerOrder(h, subMap.get(h.customer_order_id) ?? []))
        },

        async create(customer: CustomerOrderDraft, drafts: ReadonlyArray<SellerOrderDraft>): Promise<CreateCustomerOrderResult> {
            const [head] = await db
                .insert(customerOrders)
                .values({
                    user_id: customer.userId as unknown as number,
                    address: customer.address,
                    payment_method: customer.paymentMethod,
                    derived_status: 'negotiating',
                })
                .returning({customer_order_id: customerOrders.customer_order_id})
            const customerOrderId = asCustomerOrderId(head.customer_order_id)

            const createdSubs: SellerOrderId[] = []
            const createdDetails: Array<{
                sellerOrderId: SellerOrderId
                customizableItemIds: import('@/src/domain/shared/id').SellerOrderItemId[]
                customizableItemContexts: Array<{
                    itemId: import('@/src/domain/shared/id').SellerOrderItemId
                    optionSelectionsSummary: ReadonlyArray<{ groupName: string; label: string }>
                    customerNote: string
                }>
            }> = []
            for (const draft of drafts) {
                const subtotal = draft.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0)
                const pricing = calcPricing({
                    subtotal,
                    customizationDelta: 0,
                    shipping: draft.shipping,
                    commissionRate: draft.commissionRate,
                })
                const [subRow] = await db
                    .insert(sellerOrders)
                    .values({
                        customer_order_id: head.customer_order_id,
                        seller_id: draft.sellerId as unknown as number,
                        status: 'pending_seller_review',
                        subtotal: pricing.subtotal,
                        customization_delta: pricing.customizationDelta,
                        shipping: pricing.shipping,
                        commission_rate_snapshot: pricing.commissionRate,
                        commission_amount: pricing.commissionAmount,
                        total: pricing.total,
                    })
                    .returning({seller_order_id: sellerOrders.seller_order_id})

                const customizableItemIds: import('@/src/domain/shared/id').SellerOrderItemId[] = []
                const customizableItemContexts: Array<{
                    itemId: import('@/src/domain/shared/id').SellerOrderItemId
                    optionSelectionsSummary: ReadonlyArray<{ groupName: string; label: string }>
                    customerNote: string
                }> = []
                if (draft.items.length > 0) {
                    for (const it of draft.items) {
                        const [itemRow] = await db
                            .insert(sellerOrderItems)
                            .values({
                                seller_order_id: subRow.seller_order_id,
                                product_id: it.productId,
                                quantity: it.quantity,
                                unit_price: it.unitPrice,
                                customization_delta: it.customizationDelta ?? 0,
                            })
                            .returning({id: sellerOrderItems.seller_order_item_id})
                        if (it.optionValueIds && it.optionValueIds.length > 0) {
                            await db.insert(sellerOrderItemOptionSelections).values(
                                it.optionValueIds.map((vid) => ({
                                    seller_order_item_id: itemRow.id,
                                    option_value_id: vid,
                                })),
                            )
                        }
                        if (it.needsCustomization) {
                            const branded = asSellerOrderItemId(itemRow.id)
                            customizableItemIds.push(branded)
                            customizableItemContexts.push({
                                itemId: branded,
                                optionSelectionsSummary: it.optionSelectionsSummary ?? [],
                                customerNote: it.customerNote ?? '',
                            })
                        }
                    }
                }
                createdSubs.push(asSellerOrderId(subRow.seller_order_id))
                createdDetails.push({
                    sellerOrderId: asSellerOrderId(subRow.seller_order_id),
                    customizableItemIds,
                    customizableItemContexts,
                })
            }

            return {customerOrderId, sellerOrderIds: createdSubs, createdSellerOrders: createdDetails}
        },

        async updateDerivedStatus(id: CustomerOrderId, status: CustomerOrderDerivedStatus) {
            await db
                .update(customerOrders)
                .set({derived_status: status, updated_at: new Date()})
                .where(eq(customerOrders.customer_order_id, id as unknown as number))
        },
    }
}

export function sellerOrderStorageDrizzle(): SellerOrderStorage {
    return {
        async findById(id: SellerOrderId): Promise<SellerOrder | null> {
            const [head] = await db
                .select()
                .from(sellerOrders)
                .where(eq(sellerOrders.seller_order_id, id as unknown as number))
            if (!head) return null
            const items = await db
                .select()
                .from(sellerOrderItems)
                .where(eq(sellerOrderItems.seller_order_id, head.seller_order_id))
            return {
                id: asSellerOrderId(head.seller_order_id),
                customerOrderId: asCustomerOrderId(head.customer_order_id),
                sellerId: asSellerId(head.seller_id),
                status: head.status as SellerOrderStatus,
                items: items.map((it) => ({
                    id: asSellerOrderItemId(it.seller_order_item_id),
                    productId: asProductId(it.product_id),
                    quantity: it.quantity,
                    customizationThreadId: null,
                    unitPrice: it.unit_price,
                    customizationDelta: it.customization_delta,
                })),
                pricing: {
                    subtotal: head.subtotal,
                    customizationDelta: head.customization_delta,
                    shipping: head.shipping,
                    commissionRate: head.commission_rate_snapshot,
                    commissionAmount: head.commission_amount,
                    total: head.total,
                },
                stockCheck: head.stock_check as StockOverall,
                cancelReason: head.cancel_reason,
            }
        },

        async listByCustomerOrder(id: CustomerOrderId) {
            const rows = await db
                .select({id: sellerOrders.seller_order_id})
                .from(sellerOrders)
                .where(eq(sellerOrders.customer_order_id, id as unknown as number))
            const found = await Promise.all(rows.map((r) => this.findById(asSellerOrderId(r.id))))
            return found.filter((o): o is SellerOrder => o !== null)
        },

        async listBySeller(sellerId: SellerId) {
            const rows = await db
                .select({id: sellerOrders.seller_order_id})
                .from(sellerOrders)
                .where(eq(sellerOrders.seller_id, sellerId as unknown as number))
            const found = await Promise.all(rows.map((r) => this.findById(asSellerOrderId(r.id))))
            return found.filter((o): o is SellerOrder => o !== null)
        },

        async updateStatus(id: SellerOrderId, status: SellerOrderStatus, cancelReason?: string) {
            const patch: Record<string, unknown> = {status, updated_at: new Date()}
            if (cancelReason !== undefined) patch.cancel_reason = cancelReason
            if (status === 'paid') patch.paid_at = new Date()
            await db
                .update(sellerOrders)
                .set(patch)
                .where(eq(sellerOrders.seller_order_id, id as unknown as number))
        },
    }
}
