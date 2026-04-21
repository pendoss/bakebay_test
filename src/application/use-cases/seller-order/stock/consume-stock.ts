import type {SellerOrderId} from '@/src/domain/shared/id'
import {SellerOrderNotFoundError} from '@/src/domain/seller-order'
import type {SellerOrderStorage} from '@/src/application/ports/customer-order-storage'
import type {IngredientStorage} from '@/src/application/ports/ingredient-storage'
import type {IngredientReservationStorage} from '@/src/application/ports/ingredient-reservation-storage'

export interface ConsumeSellerOrderStockInput {
    readonly sellerOrderId: SellerOrderId
}

export interface ConsumeSellerOrderStockDeps {
    sellerOrderStorage: SellerOrderStorage
    ingredientStorage: IngredientStorage
    reservationStorage: IngredientReservationStorage
}

export async function consumeSellerOrderStock(
    input: ConsumeSellerOrderStockInput,
    deps: ConsumeSellerOrderStockDeps,
): Promise<void> {
    const order = await deps.sellerOrderStorage.findById(input.sellerOrderId)
    if (!order) throw new SellerOrderNotFoundError(input.sellerOrderId)

    const reservations = await deps.reservationStorage.listBySellerOrder(input.sellerOrderId)
    const active = reservations.filter((r) => r.state === 'reserved')
    if (active.length === 0) return

    for (const r of active) {
        await deps.ingredientStorage.decrementStockByKey(order.sellerId, r.ingredientKey, r.amount)
    }
    await deps.reservationStorage.updateState(input.sellerOrderId, 'consumed')
}
