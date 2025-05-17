import {integer, pgTable, real, text, varchar} from "drizzle-orm/pg-core";
import {users} from "@/src/db/schema/users";

export const sellers = pgTable ("sellers",
    {
        seller_id: integer().primaryKey().generatedAlwaysAsIdentity(),
        seller_name: varchar().notNull(),
        seller_rating: real().default(0.0),
        description: text().notNull().default(""),
        location: text().notNull().default(""),
        website: text(),
        contact_name: varchar().notNull().default(""),
        contact_email: varchar().notNull().default(""),
        contact_number: varchar().notNull().default(""),
        inn: varchar(),
        about_products: text(),
        user_id: integer().references(() => users.user_id)

    })