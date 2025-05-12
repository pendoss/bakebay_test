import {integer, pgTable, real, varchar} from "drizzle-orm/pg-core";
import {users} from "@/src/db";

export const sellers = pgTable ("sellers",
    {
        seller_id: integer().primaryKey().generatedAlwaysAsIdentity(),
        seller_name: varchar().notNull(),
        seller_rating: real().default(0.0),
    })