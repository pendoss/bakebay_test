import {and, eq, inArray, sql} from 'drizzle-orm'
import {db, sellerOrderIngredientReservations, sellerOrders} from '@/src/adapters/storage/drizzle'
import type {
    IngredientReservationStorage,
    ReservationDraft,
    ReservationRecord,
    ReservationState,
} from '@/src/application/ports/ingredient-reservation-storage'
import type {SellerId, SellerOrderId} from '@/src/domain/shared/id'
import {asSellerOrderId} from '@/src/domain/shared/id'

interface ReservationRow {
    reservation_id: number
    seller_order_id: number
    ingredient_ref: unknown
    name: string
    unit: string
    amount: number
    state: ReservationState
}

function rowToRecord(row: ReservationRow): ReservationRecord {
    const ref = row.ingredient_ref as {key?: string} | null
    return {
        reservationId: row.reservation_id,
        sellerOrderId: asSellerOrderId(row.seller_order_id),
        ingredientKey: ref?.key ?? row.name,
        name: row.name,
        unit: row.unit,
        amount: row.amount,
        state: row.state,
    }
}

export function ingredientReservationStorageDrizzle(): IngredientReservationStorage {
    return {
        async createMany(sellerOrderId: SellerOrderId, drafts: ReadonlyArray<ReservationDraft>) {
            if (drafts.length === 0) return
            await db.insert(sellerOrderIngredientReservations).values(
                drafts.map((d) => ({
                    seller_order_id: sellerOrderId as unknown as number,
                    ingredient_ref: {kind: 'recipe', key: d.ingredientKey},
                    name: d.name,
                    unit: d.unit,
                    amount: d.amount,
                    state: 'reserved' as const,
                })),
            )
        },

        async listBySellerOrder(sellerOrderId: SellerOrderId) {
            const rows = await db
                .select()
                .from(sellerOrderIngredientReservations)
                .where(
                    eq(
                        sellerOrderIngredientReservations.seller_order_id,
                        sellerOrderId as unknown as number,
                    ),
                )
            return (rows as unknown as ReservationRow[]).map(rowToRecord)
        },

        async updateState(sellerOrderId: SellerOrderId, next: ReservationState) {
            await db
                .update(sellerOrderIngredientReservations)
                .set({state: next, updated_at: new Date()})
                .where(
                    and(
                        eq(
                            sellerOrderIngredientReservations.seller_order_id,
                            sellerOrderId as unknown as number,
                        ),
                        eq(sellerOrderIngredientReservations.state, 'reserved'),
                    ),
                )
        },

        async sumReservedByKeys(
            sellerId: SellerId,
            keys: ReadonlyArray<string>,
            excludeSellerOrderId?: SellerOrderId,
        ) {
            if (keys.length === 0) return {}
            const res = await db
                .select({
                    name: sellerOrderIngredientReservations.name,
                    total: sql<number>`COALESCE(SUM(${sellerOrderIngredientReservations.amount}), 0)`,
                })
                .from(sellerOrderIngredientReservations)
                .innerJoin(
                    sellerOrders,
                    eq(
                        sellerOrderIngredientReservations.seller_order_id,
                        sellerOrders.seller_order_id,
                    ),
                )
                .where(
                    and(
                        eq(sellerOrders.seller_id, sellerId as unknown as number),
                        eq(sellerOrderIngredientReservations.state, 'reserved'),
                        inArray(sellerOrderIngredientReservations.name, keys as string[]),
                        excludeSellerOrderId !== undefined
                            ? sql`${sellerOrderIngredientReservations.seller_order_id} <> ${excludeSellerOrderId as unknown as number}`
                            : undefined,
                    ),
                )
                .groupBy(sellerOrderIngredientReservations.name)
            const out: Record<string, number> = {}
            for (const r of res) out[r.name] = Number(r.total)
            return out
        },
    }
}
