import type {SellerOrderId} from '@/src/domain/shared/id'
import {SellerOrderNotFoundError} from '@/src/domain/seller-order'
import type {SellerOrderStorage} from '@/src/application/ports/customer-order-storage'
import type {IngredientStorage} from '@/src/application/ports/ingredient-storage'
import type {
    IngredientReservationStorage,
    ReservationDraft,
} from '@/src/application/ports/ingredient-reservation-storage'

export interface ReserveSellerOrderStockInput {
    readonly sellerOrderId: SellerOrderId
}

export interface ReserveSellerOrderStockDeps {
    sellerOrderStorage: SellerOrderStorage
    ingredientStorage: IngredientStorage
    reservationStorage: IngredientReservationStorage
}

export async function reserveSellerOrderStock(
    input: ReserveSellerOrderStockInput,
    deps: ReserveSellerOrderStockDeps,
): Promise<void> {
    const order = await deps.sellerOrderStorage.findById(input.sellerOrderId)
    if (!order) throw new SellerOrderNotFoundError(input.sellerOrderId)

    const existing = await deps.reservationStorage.listBySellerOrder(input.sellerOrderId)
    if (existing.some((r) => r.state === 'reserved' || r.state === 'consumed')) return

    const required = await deps.ingredientStorage.getRequiredForSellerOrder(input.sellerOrderId)
    if (required.length === 0) return

    const drafts: ReservationDraft[] = required.map((r) => ({
        ingredientKey: r.key,
        name: r.name,
        unit: r.unit,
        amount: r.amount,
    }))
    await deps.reservationStorage.createMany(input.sellerOrderId, drafts)
}
