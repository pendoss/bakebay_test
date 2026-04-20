import {index, integer, jsonb, pgEnum, pgTable, text, timestamp} from 'drizzle-orm/pg-core'
import {users} from './users'

export const notificationKindEnum = pgEnum('notification_kind', [
    'chat_message',
    'chat_offer',
    'chat_finalized',
    'customer_accept',
    'seller_order_paid_reminder',
    'ingredient_low',
    'ingredient_out',
    'refund_requested',
    'refund_approved',
])

export const notificationSeverityEnum = pgEnum('notification_severity', [
    'info',
    'success',
    'warning',
    'error',
])

export const notifications = pgTable(
    'notifications',
    {
        notification_id: integer().primaryKey().generatedAlwaysAsIdentity(),
        recipient_user_id: integer().references(() => users.user_id).notNull(),
        kind: notificationKindEnum().notNull(),
        severity: notificationSeverityEnum().notNull().default('info'),
        title_md: text().notNull(),
        body_md: text().notNull().default(''),
        actions: jsonb().notNull().default([]),
        meta: jsonb().notNull().default({}),
        created_at: timestamp().notNull().defaultNow(),
        delivered_at: timestamp(),
        read_at: timestamp(),
        email_sent_at: timestamp(),
    },
    (t) => [index('notifications_user_idx').on(t.recipient_user_id, t.notification_id)],
)
