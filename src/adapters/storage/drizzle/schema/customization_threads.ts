import {integer, jsonb, pgEnum, pgTable, real, text, timestamp, varchar} from 'drizzle-orm/pg-core'
import {relations} from 'drizzle-orm'

export const customizationThreadStatusEnum = pgEnum('customization_thread_status', [
    'open',
    'awaiting_seller_finalize',
    'agreed',
    'rejected',
])

export const customizationMessageAuthorEnum = pgEnum('customization_message_author', [
    'customer',
    'seller',
])

export const customizationThreads = pgTable('customization_threads', {
    customization_thread_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    status: customizationThreadStatusEnum().notNull().default('open'),
    agreed_offer_id: integer(),
    created_at: timestamp().notNull().defaultNow(),
    updated_at: timestamp().notNull().defaultNow(),
})

export const customizationOffers = pgTable('customization_offers', {
    customization_offer_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    thread_id: integer().references(() => customizationThreads.customization_thread_id).notNull(),
    version: integer().notNull(),
    price_delta: real().notNull().default(0),
    spec_snapshot: jsonb().notNull(),
    superseded_by_offer_id: integer(),
    created_at: timestamp().notNull().defaultNow(),
})

export const customizationMessages = pgTable('customization_messages', {
    customization_message_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    thread_id: integer().references(() => customizationThreads.customization_thread_id).notNull(),
    author: customizationMessageAuthorEnum().notNull(),
    body: text().notNull().default(''),
    attachment_urls: jsonb().notNull().default([]),
    created_at: timestamp().notNull().defaultNow(),
})

export const customizationFinalSpecs = pgTable('customization_final_specs', {
    customization_final_spec_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    thread_id: integer().references(() => customizationThreads.customization_thread_id).notNull(),
    offer_id: integer().references(() => customizationOffers.customization_offer_id).notNull(),
    spec_snapshot: jsonb().notNull(),
    price_delta: real().notNull().default(0),
    agreed_at: timestamp().notNull().defaultNow(),
    label: varchar({length: 255}),
})

export const customizationThreadsRelations = relations(customizationThreads, ({many}) => ({
    offers: many(customizationOffers),
    messages: many(customizationMessages),
}))

export const customizationOffersRelations = relations(customizationOffers, ({one}) => ({
    thread: one(customizationThreads, {
        fields: [customizationOffers.thread_id],
        references: [customizationThreads.customization_thread_id],
    }),
}))

export const customizationMessagesRelations = relations(customizationMessages, ({one}) => ({
    thread: one(customizationThreads, {
        fields: [customizationMessages.thread_id],
        references: [customizationThreads.customization_thread_id],
    }),
}))
