import type {SellerId, SellerOrderId, UserId} from '@/src/domain/shared/id'
import {
    assertRefundRequestable,
    SellerOrderNotFoundError,
} from '@/src/domain/seller-order'
import type {
    CustomerOrderStorage,
    SellerOrderStorage,
} from '@/src/application/ports/customer-order-storage'
import type {IngredientReservationStorage} from '@/src/application/ports/ingredient-reservation-storage'
import {computeDerivedStatus} from '@/src/domain/customer-order'
import {releaseSellerOrderStock} from './stock/release-stock'
import {SellerOrderOwnershipError} from './advance-status'

export type RefundActor = 'customer' | 'seller'

export class RefundOwnershipError extends Error {
    constructor() {
        super('Only owning customer or seller may request refund')
        this.name = 'RefundOwnershipError'
    }
}

export interface RequestSellerOrderRefundInput {
    readonly sellerOrderId: SellerOrderId
    readonly actor: RefundActor
    readonly actingUserId?: UserId
    readonly actingSellerId?: SellerId
    readonly reason: string
}

export interface RequestSellerOrderRefundDeps {
    sellerOrderStorage: SellerOrderStorage
    customerOrderStorage: CustomerOrderStorage
}

export async function requestSellerOrderRefund(
    input: RequestSellerOrderRefundInput,
    deps: RequestSellerOrderRefundDeps,
): Promise<void> {
    const order = await deps.sellerOrderStorage.findById(input.sellerOrderId)
    if (!order) throw new SellerOrderNotFoundError(input.sellerOrderId)

    if (input.actor === 'seller') {
        if (!input.actingSellerId || order.sellerId !== input.actingSellerId) {
            throw new SellerOrderOwnershipError(input.sellerOrderId, input.actingSellerId ?? order.sellerId)
        }
    } else {
        const customerOrder = await deps.customerOrderStorage.findById(order.customerOrderId)
        if (!customerOrder || !input.actingUserId || customerOrder.userId !== input.actingUserId) {
            throw new RefundOwnershipError()
        }
    }

    assertRefundRequestable(order)
    await deps.sellerOrderStorage.updateRefund(input.sellerOrderId, 'requested', input.reason.trim())
}

export interface ApproveSellerOrderRefundInput {
    readonly sellerOrderId: SellerOrderId
}

export interface ApproveSellerOrderRefundDeps {
    sellerOrderStorage: SellerOrderStorage
    customerOrderStorage: CustomerOrderStorage
    reservationStorage?: IngredientReservationStorage
}

export async function approveSellerOrderRefund(
    input: ApproveSellerOrderRefundInput,
    deps: ApproveSellerOrderRefundDeps,
): Promise<void> {
    const order = await deps.sellerOrderStorage.findById(input.sellerOrderId)
    if (!order) throw new SellerOrderNotFoundError(input.sellerOrderId)
    if (order.refundState !== 'requested') {
        throw new Error(`Refund not in 'requested' state (was ${order.refundState})`)
    }
    await deps.sellerOrderStorage.updateRefund(
        input.sellerOrderId,
        'approved',
        order.refundReason,
    )
    await deps.sellerOrderStorage.updateStatus(
        input.sellerOrderId,
        'cancelled',
        order.refundReason ?? 'refunded',
    )
    if (deps.reservationStorage) {
        await releaseSellerOrderStock(
            {sellerOrderId: input.sellerOrderId},
            {reservationStorage: deps.reservationStorage},
        )
    }
    const siblings = await deps.sellerOrderStorage.listByCustomerOrder(order.customerOrderId)
    const derived = computeDerivedStatus(siblings.map((s) => s.status))
    await deps.customerOrderStorage.updateDerivedStatus(order.customerOrderId, derived)
}
