import type {SellerOrderId} from '@/src/domain/shared/id'
import {
    SellerOrderNotFoundError,
    checkIngredientAvailability,
    type StockEntry,
    type StockOverall,
    type StockReport,
} from '@/src/domain/seller-order'
import type {SellerOrderStorage} from '@/src/application/ports/customer-order-storage'
import type {IngredientStorage} from '@/src/application/ports/ingredient-storage'
import type {IngredientReservationStorage} from '@/src/application/ports/ingredient-reservation-storage'

export interface CheckSellerOrderStockInput {
    readonly sellerOrderId: SellerOrderId
}

export interface CheckSellerOrderStockDeps {
    sellerOrderStorage: SellerOrderStorage
    ingredientStorage: IngredientStorage
    reservationStorage: IngredientReservationStorage
}

export async function checkSellerOrderStock(
    input: CheckSellerOrderStockInput,
    deps: CheckSellerOrderStockDeps,
): Promise<StockReport> {
    const order = await deps.sellerOrderStorage.findById(input.sellerOrderId)
    if (!order) throw new SellerOrderNotFoundError(input.sellerOrderId)

    const required = await deps.ingredientStorage.getRequiredForSellerOrder(input.sellerOrderId)
    const keys = Array.from(new Set(required.map((r) => r.key)))

    const rawStock = await deps.ingredientStorage.getStockByKeys(order.sellerId, keys)
    const reservedByKey = await deps.reservationStorage.sumReservedByKeys(
        order.sellerId,
        keys,
        input.sellerOrderId,
    )

    const stockEntries: Record<string, StockEntry> = {}
    for (const key of keys) {
        const raw = rawStock[key]
        if (!raw) continue
        const reserved = reservedByKey[key] ?? 0
        stockEntries[key] = {
            key,
            available: Math.max(0, raw.stock - reserved),
            alertThreshold: raw.alertThreshold,
        }
    }

    const report = checkIngredientAvailability(required, stockEntries)
    const overall: StockOverall = report.overall === 'available' ? 'ok' : report.overall
    await deps.sellerOrderStorage.updateStockCheck(input.sellerOrderId, overall)
    return report
}
