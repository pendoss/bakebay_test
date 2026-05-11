import {boolean, integer, pgEnum, pgTable, real, varchar} from 'drizzle-orm/pg-core';
import {products} from '@/src/adapters/storage/drizzle/schema/products';

export const stockStatusEnum = pgEnum('stock_status', ['ok', 'low', 'out']);

export const productIngredients = pgTable('product_ingredients', {
    ingredient_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    product_id: integer().references(() => products.product_id),
    name: varchar().notNull(),
    amount: real().notNull().default(0.0),
    stock: real().default(0.0),
    unit: varchar().notNull(),
    alert: integer().default(0),
    status: stockStatusEnum().default('out'),
    purchase_qty: real().default(1),
    purchase_price: real().default(0),
    is_optional: boolean().notNull().default(false),
});