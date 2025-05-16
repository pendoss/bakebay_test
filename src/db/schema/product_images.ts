import {integer, pgTable, varchar, boolean} from "drizzle-orm/pg-core";
import {products} from "@/src/db/schema/products";

export const productImages = pgTable("product_images", {
    image_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    product_id: integer().references(() => products.product_id),
    image_url: varchar().notNull(),
    name: varchar(),
    is_main: boolean().default(false),
    display_order: integer().default(0),
    s3_key: varchar(),
});
