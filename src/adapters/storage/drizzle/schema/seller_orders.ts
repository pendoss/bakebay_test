import {integer, pgEnum, pgTable, real, text, timestamp} from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'
import {customerOrders} from './customer_orders'
import {sellers} from './sellers'
import {sellerOrderItems} from './seller_order_items'

export const sellerOrderStatusEnum = pgEnum('seller_order_status', [
    'draft',
    'pending_seller_review',
    'negotiating',
    'awaiting_customer_approval',
    'confirmed',
    'paid',
    'preparing_blocked',
    'preparing',
    'ready_to_ship',
    'delivering',
    'delivered',
    'cancelled',
])

export const sellerOrderStockCheckEnum = pgEnum('seller_order_stock_check', [
    'ok',
    'low',
    'missing',
    'unknown',
])

export const sellerOrderRefundStateEnum = pgEnum('refund_state', [
    'none',
    'requested',
    'approved',
    'rejected',
])

export const sellerOrders = pgTable('seller_orders', {
    seller_order_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    customer_order_id: integer().references(() => customerOrders.customer_order_id).notNull(),
    seller_id: integer().references(() => sellers.seller_id).notNull(),
    status: sellerOrderStatusEnum().notNull().default('pending_seller_review'),
    subtotal: integer().notNull().default(0),
    customization_delta: integer().notNull().default(0),
    shipping: integer().notNull().default(0),
    commission_rate_snapshot: real().notNull().default(0.1),
    commission_amount: integer().notNull().default(0),
    total: integer().notNull().default(0),
    stock_check: sellerOrderStockCheckEnum().notNull().default('unknown'),
    refund_state: sellerOrderRefundStateEnum().notNull().default('none'),
    refund_reason: text(),
    cancel_reason: text(),
    paid_at: timestamp(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
})

export const sellerOrdersRelations = relations(sellerOrders, ({one, many}) => ({
    customerOrder: one(customerOrders, {
        fields: [sellerOrders.customer_order_id],
        references: [customerOrders.customer_order_id],
    }),
    seller: one(sellers, {fields: [sellerOrders.seller_id], references: [sellers.seller_id]}),
    items: many(sellerOrderItems),
}))
