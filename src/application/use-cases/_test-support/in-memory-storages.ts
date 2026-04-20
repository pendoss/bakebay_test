import type {
    CustomerOrderDraft,
    CustomerOrderStorage,
    SellerOrderDraft,
    SellerOrderStorage,
} from '@/src/application/ports/customer-order-storage'
import type {
    IngredientReservationStorage,
    ReservationDraft,
    ReservationRecord,
    ReservationState,
} from '@/src/application/ports/ingredient-reservation-storage'
import type {IngredientStorage, RawStockEntry} from '@/src/application/ports/ingredient-storage'
import type {ProductLookup, ProductLookupRecord} from '@/src/application/ports/product-lookup'
import type {SellerCommissionLookup} from '@/src/application/ports/seller-commission-lookup'
import type {
    CustomerOrder,
    CustomerOrderDerivedStatus,
} from '@/src/domain/customer-order'
import type {Ingredient} from '@/src/domain/ingredient'
import type {RequiredIngredient, SellerOrder, SellerOrderStatus, StockOverall} from '@/src/domain/seller-order'
import {calcItemsSubtotal, calcPricing} from '@/src/domain/seller-order'
import {
    asCustomerOrderId,
    asSellerId,
    asSellerOrderId,
    asSellerOrderItemId,
    asProductId,
} from '@/src/domain/shared/id'
import type {
    CustomerOrderId,
    ProductId,
    SellerId,
    SellerOrderId,
    SellerOrderItemId,
    UserId,
} from '@/src/domain/shared/id'

export function makeInMemoryStorages() {
    let customerSeq = 0
    let sellerSeq = 0
    let itemSeq = 0

    const customers = new Map<CustomerOrderId, CustomerOrder>()
    const subs = new Map<SellerOrderId, SellerOrder>()

    const customerOrderStorage: CustomerOrderStorage = {
        async findById(id: CustomerOrderId) {
            return customers.get(id) ?? null
        },
        async listByUser(userId: UserId) {
            return Array.from(customers.values()).filter((c) => c.userId === userId)
        },
        async create(draft: CustomerOrderDraft, sellerDrafts: ReadonlyArray<SellerOrderDraft>) {
            customerSeq += 1
            const customerOrderId = asCustomerOrderId(customerSeq)
            const createdSubs: SellerOrderId[] = []
            const createdDetails: Array<{
                sellerOrderId: SellerOrderId
                customizableItemIds: SellerOrderItemId[]
                customizableItemContexts: Array<{
                    itemId: SellerOrderItemId
                    optionSelectionsSummary: ReadonlyArray<{ groupName: string; label: string }>
                    customerNote: string
                }>
            }> = []
            for (const s of sellerDrafts) {
                sellerSeq += 1
                const id = asSellerOrderId(sellerSeq)
                const customizableItemIds: SellerOrderItemId[] = []
                const customizableItemContexts: Array<{
                    itemId: SellerOrderItemId
                    optionSelectionsSummary: ReadonlyArray<{ groupName: string; label: string }>
                    customerNote: string
                }> = []
                const items = s.items.map((it) => {
                    itemSeq += 1
                    const itemId = asSellerOrderItemId(itemSeq)
                    if (it.needsCustomization) {
                        customizableItemIds.push(itemId)
                        customizableItemContexts.push({
                            itemId,
                            optionSelectionsSummary: it.optionSelectionsSummary ?? [],
                            customerNote: it.customerNote ?? '',
                        })
                    }
                    return {
                        id: itemId,
                        productId: asProductId(it.productId),
                        quantity: it.quantity,
                        unitPrice: it.unitPrice,
                        customizationDelta: it.customizationDelta ?? 0,
                        customizationThreadId: null,
                    }
                })
                const subtotal = calcItemsSubtotal(items)
                const pricing = calcPricing({
                    subtotal,
                    customizationDelta: 0,
                    shipping: s.shipping,
                    commissionRate: s.commissionRate,
                })
                subs.set(id, {
                    id,
                    customerOrderId,
                    sellerId: s.sellerId,
                    status: 'pending_seller_review',
                    items,
                    pricing,
                    stockCheck: 'unknown',
                    cancelReason: null,
                })
                createdSubs.push(id)
                createdDetails.push({sellerOrderId: id, customizableItemIds, customizableItemContexts})
            }
            customers.set(customerOrderId, {
                id: customerOrderId,
                userId: draft.userId,
                derivedStatus: 'negotiating',
                address: draft.address,
                createdAt: new Date(),
                sellerOrderIds: createdSubs,
            })
            return {customerOrderId, sellerOrderIds: createdSubs, createdSellerOrders: createdDetails}
        },
        async updateDerivedStatus(id: CustomerOrderId, status: CustomerOrderDerivedStatus) {
            const existing = customers.get(id)
            if (!existing) return
            customers.set(id, {...existing, derivedStatus: status})
        },
    }

    const sellerOrderStorage: SellerOrderStorage = {
        async findById(id: SellerOrderId) {
            return subs.get(id) ?? null
        },
        async listByCustomerOrder(id: CustomerOrderId) {
            return Array.from(subs.values()).filter((s) => s.customerOrderId === id)
        },
        async listBySeller(sellerId: SellerId) {
            return Array.from(subs.values()).filter((s) => s.sellerId === sellerId)
        },
        async updateStatus(id: SellerOrderId, status: SellerOrderStatus, cancelReason?: string) {
            const existing = subs.get(id)
            if (!existing) return
            subs.set(id, {...existing, status, cancelReason: cancelReason ?? existing.cancelReason})
        },
        async updateStockCheck(id: SellerOrderId, stockCheck: StockOverall) {
            const existing = subs.get(id)
            if (!existing) return
            subs.set(id, {...existing, stockCheck})
        },
    }

    return {customerOrderStorage, sellerOrderStorage, customers, subs}
}

export interface InMemoryStockOptions {
    stockByKey: Record<string, RawStockEntry>
    requiredBySellerOrder: Map<SellerOrderId, ReadonlyArray<RequiredIngredient>>
}

export function makeInMemoryStockStorages(opts: InMemoryStockOptions) {
    const stock = new Map<string, RawStockEntry>(Object.entries(opts.stockByKey))
    let reservationSeq = 0
    const reservations: ReservationRecord[] = []

    const ingredientStorage: IngredientStorage = {
        async listBySeller() {
            return [] as Ingredient[]
        },
        async listByProduct() {
            return [] as Ingredient[]
        },
        async findByNameAndProduct() {
            return null
        },
        async updateById() {
            /* noop */
        },
        async updateByName() {
            /* noop */
        },
        async getStockByKeys(_sellerId: SellerId, keys: ReadonlyArray<string>) {
            const out: Record<string, RawStockEntry> = {}
            for (const k of keys) {
                const entry = stock.get(k)
                if (entry) out[k] = entry
            }
            return out
        },
        async getRequiredForSellerOrder(id: SellerOrderId) {
            return [...(opts.requiredBySellerOrder.get(id) ?? [])]
        },
        async decrementStockByKey(_sellerId: SellerId, key: string, amount: number) {
            const cur = stock.get(key)
            if (!cur) return
            stock.set(key, {stock: Math.max(0, cur.stock - amount), alertThreshold: cur.alertThreshold})
        },
    }

    const reservationStorage: IngredientReservationStorage = {
        async createMany(sellerOrderId: SellerOrderId, drafts: ReadonlyArray<ReservationDraft>) {
            for (const d of drafts) {
                reservationSeq += 1
                reservations.push({
                    reservationId: reservationSeq,
                    sellerOrderId,
                    ingredientKey: d.ingredientKey,
                    name: d.name,
                    unit: d.unit,
                    amount: d.amount,
                    state: 'reserved',
                })
            }
        },
        async listBySellerOrder(sellerOrderId: SellerOrderId) {
            return reservations.filter((r) => r.sellerOrderId === sellerOrderId)
        },
        async updateState(sellerOrderId: SellerOrderId, next: ReservationState) {
            for (let i = 0; i < reservations.length; i += 1) {
                const r = reservations[i]
                if (r.sellerOrderId === sellerOrderId && r.state === 'reserved') {
                    reservations[i] = {...r, state: next}
                }
            }
        },
        async sumReservedByKeys(
            _sellerId: SellerId,
            keys: ReadonlyArray<string>,
            excludeSellerOrderId?: SellerOrderId,
        ) {
            const out: Record<string, number> = {}
            for (const k of keys) out[k] = 0
            for (const r of reservations) {
                if (r.state !== 'reserved') continue
                if (excludeSellerOrderId !== undefined && r.sellerOrderId === excludeSellerOrderId) continue
                if (!keys.includes(r.ingredientKey)) continue
                out[r.ingredientKey] = (out[r.ingredientKey] ?? 0) + r.amount
            }
            return out
        },
    }

    return {ingredientStorage, reservationStorage, stock, reservations}
}

export function makeProductLookup(records: ProductLookupRecord[]): ProductLookup {
    return {
        async getMany(ids: ReadonlyArray<ProductId>) {
            return records.filter((r) => ids.includes(r.productId))
        },
    }
}

export function makeCommissionLookup(rates: Record<number, number>, defaultRate = 0.1): SellerCommissionLookup {
    return {
        async getRate(sellerId: SellerId) {
            const key = sellerId as unknown as number
            return rates[key] ?? defaultRate
        },
    }
}

export const productRecord = (
    productId: number,
    sellerId: number,
    price: number,
    isCustomizable = false,
): ProductLookupRecord => ({
    productId: asProductId(productId),
    sellerId: asSellerId(sellerId),
    price,
    isCustomizable,
})
