import {integer, pgEnum, pgTable, text, timestamp} from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'
import {users} from './users'
import {sellerOrders} from './seller_orders'

export const customerOrderDerivedStatusEnum = pgEnum('customer_order_derived_status', [
    'negotiating',
    'awaiting_payment',
    'partially_paid',
    'in_fulfillment',
    'partially_delivered',
    'delivered',
    'cancelled',
    'partially_cancelled',
])

export const customerOrders = pgTable('customer_orders', {
    customer_order_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    user_id: integer().references(() => users.user_id).notNull(),
    derived_status: customerOrderDerivedStatusEnum().notNull().default('negotiating'),
    address: text().notNull(),
    payment_method: text().notNull().default('card'),
    total_estimated: integer(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
})

export const customerOrdersRelations = relations(customerOrders, ({one, many}) => ({
    user: one(users, {fields: [customerOrders.user_id], references: [users.user_id]}),
    sellerOrders: many(sellerOrders),
}))
