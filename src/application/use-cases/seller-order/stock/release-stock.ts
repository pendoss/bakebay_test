import type {SellerOrderId} from '@/src/domain/shared/id'
import type {IngredientReservationStorage} from '@/src/application/ports/ingredient-reservation-storage'

export interface ReleaseSellerOrderStockInput {
    readonly sellerOrderId: SellerOrderId
}

export interface ReleaseSellerOrderStockDeps {
    reservationStorage: IngredientReservationStorage
}

export async function releaseSellerOrderStock(
    input: ReleaseSellerOrderStockInput,
    deps: ReleaseSellerOrderStockDeps,
): Promise<void> {
    const reservations = await deps.reservationStorage.listBySellerOrder(input.sellerOrderId)
    if (reservations.every((r) => r.state !== 'reserved')) return
    await deps.reservationStorage.updateState(input.sellerOrderId, 'released')
}
