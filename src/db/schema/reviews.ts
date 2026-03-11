import {integer, pgTable, text, timestamp} from "drizzle-orm/pg-core";
import {products} from "@/src/db/schema/products";
import {users} from "@/src/db/schema/users";
import {sellers} from "@/src/db/schema/sellers";

export const reviews = pgTable("reviews", {
    review_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    product_id: integer().references(() => products.product_id).notNull(),
    user_id: integer().references(() => users.user_id).notNull(),
    seller_id: integer().references(() => sellers.seller_id).notNull(),
    rating: integer().notNull(),
    comment: text().notNull(),
    seller_reply: text(),
    reply_date: timestamp(),
    created_at: timestamp().notNull(),
    updated_at: timestamp().notNull(),
});
