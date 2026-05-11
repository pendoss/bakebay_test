import {integer, pgTable, real} from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'
import {sellerOrders} from './seller_orders'
import {products} from './products'
import {customizationThreads} from './customization_threads'

export const sellerOrderItems = pgTable('seller_order_items', {
    seller_order_item_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    seller_order_id: integer().references(() => sellerOrders.seller_order_id).notNull(),
    product_id: integer().references(() => products.product_id).notNull(),
    quantity: integer().notNull(),
    unit_price: real().notNull(),
    customization_delta: real().notNull().default(0),
    customization_thread_id: integer().references(() => customizationThreads.customization_thread_id),
})

export const sellerOrderItemsRelations = relations(sellerOrderItems, ({one}) => ({
    sellerOrder: one(sellerOrders, {
        fields: [sellerOrderItems.seller_order_id],
        references: [sellerOrders.seller_order_id],
    }),
    product: one(products, {
        fields: [sellerOrderItems.product_id],
        references: [products.product_id],
    }),
    customizationThread: one(customizationThreads, {
        fields: [sellerOrderItems.customization_thread_id],
        references: [customizationThreads.customization_thread_id],
    }),
}))
