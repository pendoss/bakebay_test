import {integer, jsonb, pgEnum, pgTable, real, timestamp, varchar} from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'
import {sellerOrders} from './seller_orders'

export const reservationStateEnum = pgEnum('reservation_state', ['reserved', 'consumed', 'released'])

export const sellerOrderIngredientReservations = pgTable('seller_order_ingredient_reservations', {
    reservation_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    seller_order_id: integer().references(() => sellerOrders.seller_order_id).notNull(),
    ingredient_ref: jsonb().notNull(),
    name: varchar({length: 255}).notNull(),
    unit: varchar({length: 32}).notNull(),
    amount: real().notNull(),
    state: reservationStateEnum().notNull().default('reserved'),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
})

export const sellerOrderIngredientReservationsRelations = relations(
    sellerOrderIngredientReservations,
    ({one}) => ({
        sellerOrder: one(sellerOrders, {
            fields: [sellerOrderIngredientReservations.seller_order_id],
            references: [sellerOrders.seller_order_id],
        }),
    }),
)
