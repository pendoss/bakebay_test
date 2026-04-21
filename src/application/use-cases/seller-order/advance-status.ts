import type {SellerId, SellerOrderId} from '@/src/domain/shared/id'
import {
    assertTransition,
    SellerOrderNotFoundError,
    type SellerOrderStatus,
} from '@/src/domain/seller-order'
import type {
    CustomerOrderStorage,
    SellerOrderStorage,
} from '@/src/application/ports/customer-order-storage'
import type {IngredientStorage} from '@/src/application/ports/ingredient-storage'
import type {IngredientReservationStorage} from '@/src/application/ports/ingredient-reservation-storage'
import {computeDerivedStatus} from '@/src/domain/customer-order'
import {checkSellerOrderStock} from './stock/check-stock'
import {reserveSellerOrderStock} from './stock/reserve-stock'
import {consumeSellerOrderStock} from './stock/consume-stock'
import {releaseSellerOrderStock} from './stock/release-stock'

export class SellerOrderOwnershipError extends Error {
    constructor(id: SellerOrderId, sellerId: SellerId) {
        super(`Seller ${sellerId} does not own seller order ${id}`)
        this.name = 'SellerOrderOwnershipError'
    }
}

export interface AdvanceSellerOrderStatusInput {
    readonly sellerOrderId: SellerOrderId
    readonly actingSellerId: SellerId
    readonly next: SellerOrderStatus
}

export interface StockDeps {
    ingredientStorage: IngredientStorage
    reservationStorage: IngredientReservationStorage
}

export interface AdvanceSellerOrderStatusDeps {
    sellerOrderStorage: SellerOrderStorage
    customerOrderStorage: CustomerOrderStorage
    stock?: StockDeps
}

export async function advanceSellerOrderStatus(
    input: AdvanceSellerOrderStatusInput,
    deps: AdvanceSellerOrderStatusDeps,
): Promise<void> {
    const order = await deps.sellerOrderStorage.findById(input.sellerOrderId)
    if (!order) throw new SellerOrderNotFoundError(input.sellerOrderId)
    if (order.sellerId !== input.actingSellerId) {
        throw new SellerOrderOwnershipError(input.sellerOrderId, input.actingSellerId)
    }

    const stock = deps.stock
    let target = input.next

    if (stock && target === 'preparing' && order.status === 'paid') {
        const report = await checkSellerOrderStock(
            {sellerOrderId: input.sellerOrderId},
            {sellerOrderStorage: deps.sellerOrderStorage, ...stock},
        )
        if (report.overall === 'missing') target = 'preparing_blocked'
    }

    assertTransition(order.status, target)
    await deps.sellerOrderStorage.updateStatus(input.sellerOrderId, target)

    if (stock) {
        if (target === 'confirmed') {
            await reserveSellerOrderStock(
                {sellerOrderId: input.sellerOrderId},
                {sellerOrderStorage: deps.sellerOrderStorage, ...stock},
            )
            await checkSellerOrderStock(
                {sellerOrderId: input.sellerOrderId},
                {sellerOrderStorage: deps.sellerOrderStorage, ...stock},
            )
        } else if (target === 'ready_to_ship') {
            await consumeSellerOrderStock(
                {sellerOrderId: input.sellerOrderId},
                {sellerOrderStorage: deps.sellerOrderStorage, ...stock},
            )
        } else if (target === 'cancelled') {
            await releaseSellerOrderStock(
                {sellerOrderId: input.sellerOrderId},
                {reservationStorage: stock.reservationStorage},
            )
        }
    }

    await recomputeDerivedStatus(order.customerOrderId, deps)
}

async function recomputeDerivedStatus(
    customerOrderId: Parameters<CustomerOrderStorage['updateDerivedStatus']>[0],
    deps: AdvanceSellerOrderStatusDeps,
): Promise<void> {
    const siblings = await deps.sellerOrderStorage.listByCustomerOrder(customerOrderId)
    if (siblings.length === 0) return
    const derived = computeDerivedStatus(siblings.map((s) => s.status))
    await deps.customerOrderStorage.updateDerivedStatus(customerOrderId, derived)
}
