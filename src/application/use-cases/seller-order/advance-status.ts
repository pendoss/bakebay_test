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
import {computeDerivedStatus} from '@/src/domain/customer-order'

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

export interface AdvanceSellerOrderStatusDeps {
    sellerOrderStorage: SellerOrderStorage
    customerOrderStorage: CustomerOrderStorage
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
    assertTransition(order.status, input.next)
    await deps.sellerOrderStorage.updateStatus(input.sellerOrderId, input.next)
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
