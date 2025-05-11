import {integer, pgTable} from "drizzle-orm/pg-core";
import {orders} from "@/src/db/schema/orders";
import {products} from "@/src/db/schema/products";

export const orderItems = pgTable (
    "order_items", {
        order_item_id: integer().primaryKey().generatedAlwaysAsIdentity(),
        order_id: integer().references(()=> orders.order_id),
        product_id: integer().references(() => products.product_id),
        quantity: integer().notNull(),
    }
)