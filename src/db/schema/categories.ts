import {integer, pgTable, varchar} from "drizzle-orm/pg-core";

export const categories = pgTable('categories', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({length: 255}).notNull()

});