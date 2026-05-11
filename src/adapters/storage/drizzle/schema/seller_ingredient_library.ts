import {integer, pgTable, real, varchar} from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'
import {sellers} from './sellers'

export const sellerIngredientLibrary = pgTable('seller_ingredient_library', {
    seller_ingredient_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    seller_id: integer().references(() => sellers.seller_id).notNull(),
    name: varchar({length: 255}).notNull(),
    unit: varchar({length: 32}).notNull(),
    default_amount: real().notNull().default(0),
    price_delta: real().notNull().default(0),
})

export const sellerIngredientLibraryRelations = relations(sellerIngredientLibrary, ({one}) => ({
    seller: one(sellers, {
        fields: [sellerIngredientLibrary.seller_id],
        references: [sellers.seller_id],
    }),
}))
