import {integer, pgTable, text} from "drizzle-orm/pg-core";
import {products} from "@/src/db";

export const dietaryConstrains = pgTable('dietary_constrains', {
    id: integer().generatedByDefaultAsIdentity(),
    name: text().notNull(),
    product_id: integer().references(()=> products.product_id),
})
