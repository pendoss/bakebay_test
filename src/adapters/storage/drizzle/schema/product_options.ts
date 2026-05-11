import {integer, pgEnum, pgTable, real, varchar} from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'
import {products} from './products'
import {sellerOrderItems} from './seller_order_items'

export const productOptionGroupKindEnum = pgEnum('product_option_group_kind', [
    'size',
    'color',
    'flavor',
    'custom',
])

export const productOptionGroups = pgTable('product_option_groups', {
    product_option_group_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    product_id: integer().references(() => products.product_id).notNull(),
    name: varchar({length: 255}).notNull(),
    kind: productOptionGroupKindEnum().notNull().default('custom'),
    is_required: integer().notNull().default(0),
})

export const productOptionValues = pgTable('product_option_values', {
    product_option_value_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    group_id: integer().references(() => productOptionGroups.product_option_group_id).notNull(),
    label: varchar({length: 255}).notNull(),
    price_delta: real().notNull().default(0),
})

export const sellerOrderItemOptionSelections = pgTable('seller_order_item_option_selections', {
    selection_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    seller_order_item_id: integer().references(() => sellerOrderItems.seller_order_item_id).notNull(),
    option_value_id: integer().references(() => productOptionValues.product_option_value_id).notNull(),
})

export const productOptionGroupsRelations = relations(productOptionGroups, ({one, many}) => ({
    product: one(products, {
        fields: [productOptionGroups.product_id],
        references: [products.product_id],
    }),
    values: many(productOptionValues),
}))

export const productOptionValuesRelations = relations(productOptionValues, ({one}) => ({
    group: one(productOptionGroups, {
        fields: [productOptionValues.group_id],
        references: [productOptionGroups.product_option_group_id],
    }),
}))
