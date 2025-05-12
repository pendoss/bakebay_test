import {integer, pgEnum, pgTable, text, timestamp} from "drizzle-orm/pg-core";
import {users} from "@/src/db/schema/users";

export const orderStatusEnum = pgEnum('order_status', ['ordering', 'processing', 'payed', 'processed', 'in_progress', 'delivering', 'delivered']);

export const orders = pgTable("orders", {
        order_id: integer().primaryKey().generatedAlwaysAsIdentity(),
        date: timestamp().notNull(),
        order_status: orderStatusEnum().default('ordering'),
        user_id: integer().references(() => users.user_id),
        total_price: integer(),
        address: text().notNull(),
        payment_method: text().notNull(),
        created_at: integer(),
        updated_at: integer(),
    },
)
