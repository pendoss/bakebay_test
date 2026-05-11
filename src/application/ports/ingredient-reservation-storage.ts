import type {SellerId, SellerOrderId} from '@/src/domain/shared/id'

export type ReservationState = 'reserved' | 'consumed' | 'released'

export interface ReservationDraft {
    readonly ingredientKey: string
    readonly name: string
    readonly unit: string
    readonly amount: number
}

export interface ReservationRecord {
    readonly reservationId: number
    readonly sellerOrderId: SellerOrderId
    readonly ingredientKey: string
    readonly name: string
    readonly unit: string
    readonly amount: number
    readonly state: ReservationState
}

export interface IngredientReservationStorage {
    createMany(sellerOrderId: SellerOrderId, drafts: ReadonlyArray<ReservationDraft>): Promise<void>

    listBySellerOrder(sellerOrderId: SellerOrderId): Promise<ReservationRecord[]>

    updateState(sellerOrderId: SellerOrderId, next: ReservationState): Promise<void>

    sumReservedByKeys(
        sellerId: SellerId,
        keys: ReadonlyArray<string>,
        excludeSellerOrderId?: SellerOrderId,
    ): Promise<Record<string, number>>
}
