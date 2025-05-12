import { integer, pgTable,pgEnum, varchar, text } from "drizzle-orm/pg-core";
import {timestamp} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum ('role', ['customer', 'admin', 'seller']);
export const users = pgTable("users", {
    user_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar({length: 255}).notNull().unique(),
    first_name: varchar({length: 255}).notNull(),
    last_name: varchar({length: 255}).notNull(),
    phone_number: varchar({length: 255}).notNull(),
    address: text(),
    city: varchar({length: 255}),
    postal_code: varchar({length: 255}),
    country: varchar({length: 255}),
    user_role: roleEnum().default('customer'),
    created_at: timestamp().notNull(),
    updated_at: timestamp().notNull()
});