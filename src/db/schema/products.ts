import {integer, pgTable, real, text, varchar} from "drizzle-orm/pg-core";
import {sellers} from "@/src/db/schema/sellers";
import {categories} from "@/src/db/schema/categories";

export const products = pgTable ( "products", {
        product_id: integer().primaryKey().generatedAlwaysAsIdentity(),
        seller_id: integer().references(() => sellers.seller_id),
        product_name: varchar().notNull(),
        price: real().notNull(),
        short_desc: text().notNull(),
        long_desc: text().notNull(),
        category: varchar().notNull(),
        storage_conditions: varchar().notNull(),
        stock: integer(),
        category_id: integer().references(() => categories.id),



})