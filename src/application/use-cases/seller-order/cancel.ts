import type {SellerId, SellerOrderId} from '@/src/domain/shared/id'
import {
    assertCancellable,
    SellerOrderNotFoundError,
    type CancelActor,
} from '@/src/domain/seller-order'
import {computeDerivedStatus} from '@/src/domain/customer-order'
import type {
    CustomerOrderStorage,
    SellerOrderStorage,
} from '@/src/application/ports/customer-order-storage'
import type {IngredientReservationStorage} from '@/src/application/ports/ingredient-reservation-storage'
import {SellerOrderOwnershipError} from './advance-status'
import {releaseSellerOrderStock} from './stock/release-stock'

export interface CancelSellerOrderInput {
    readonly sellerOrderId: SellerOrderId
    readonly actor: CancelActor
    readonly actingSellerId?: SellerId
    readonly reason: string
}

export interface CancelSellerOrderDeps {
    sellerOrderStorage: SellerOrderStorage
    customerOrderStorage: CustomerOrderStorage
    reservationStorage?: IngredientReservationStorage
}

export async function cancelSellerOrder(
    input: CancelSellerOrderInput,
    deps: CancelSellerOrderDeps,
): Promise<void> {
    const order = await deps.sellerOrderStorage.findById(input.sellerOrderId)
    if (!order) throw new SellerOrderNotFoundError(input.sellerOrderId)

    if (input.actor === 'seller' && (!input.actingSellerId || order.sellerId !== input.actingSellerId)) {
        throw new SellerOrderOwnershipError(input.sellerOrderId, input.actingSellerId ?? order.sellerId)
    }

    assertCancellable(order.status, input.actor)
    await deps.sellerOrderStorage.updateStatus(input.sellerOrderId, 'cancelled', input.reason)

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
