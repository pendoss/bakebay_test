import type {CustomerOrderStorage, SellerOrderStorage} from '@/src/application/ports/customer-order-storage'
import type {SellerOrderId, UserId} from '@/src/domain/shared/id'
import {
    assertTransition,
    SellerOrderNotFoundError,
} from '@/src/domain/seller-order'
import {computeDerivedStatus} from '@/src/domain/customer-order'

export class SellerOrderAccessDeniedError extends Error {
    constructor(sellerOrderId: SellerOrderId) {
        super(`User cannot pay for seller order ${sellerOrderId}`)
        this.name = 'SellerOrderAccessDeniedError'
    }
}

export interface PaySellerOrderInput {
    readonly sellerOrderId: SellerOrderId
    readonly payingUserId: UserId
}

export interface PaySellerOrderResult {
    readonly sellerOrderId: SellerOrderId
    readonly amount: number
    readonly paidAt: Date
}

export async function paySellerOrder(
    input: PaySellerOrderInput,
    deps: {
        sellerOrderStorage: SellerOrderStorage
        customerOrderStorage: CustomerOrderStorage
    },
): Promise<PaySellerOrderResult> {
    const order = await deps.sellerOrderStorage.findById(input.sellerOrderId)
    if (!order) throw new SellerOrderNotFoundError(input.sellerOrderId)

    const root = await deps.customerOrderStorage.findById(order.customerOrderId)
    if (!root || root.userId !== input.payingUserId) {
        throw new SellerOrderAccessDeniedError(input.sellerOrderId)
    }

    assertTransition(order.status, 'paid')
    await deps.sellerOrderStorage.updateStatus(input.sellerOrderId, 'paid')

    const siblings = await deps.sellerOrderStorage.listByCustomerOrder(order.customerOrderId)
    if (siblings.length > 0) {
        const derived = computeDerivedStatus(
            siblings.map((s) => (s.id === input.sellerOrderId ? 'paid' : s.status)),
        )
        await deps.customerOrderStorage.updateDerivedStatus(order.customerOrderId, derived)
    }

    return {
        sellerOrderId: input.sellerOrderId,
        amount: order.pricing.total,
        paidAt: new Date(),
    }
}
