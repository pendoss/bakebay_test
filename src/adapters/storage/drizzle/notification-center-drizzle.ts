import {and, desc, eq, isNull, lt, sql} from 'drizzle-orm'
import {db, notifications} from '@/src/adapters/storage/drizzle'
import type {
    Notification,
    NotificationAction,
    NotificationDraft,
    NotificationKind,
    NotificationSeverity,
} from '@/src/domain/notification'
import type {
    ListNotificationsQuery,
    NotificationCenter,
} from '@/src/application/ports/notification-center'
import {asNotificationId, asUserId} from '@/src/domain/shared/id'
import type {NotificationId, UserId} from '@/src/domain/shared/id'

interface Row {
    notification_id: number
    recipient_user_id: number
    kind: NotificationKind
    severity: NotificationSeverity
    title_md: string
    body_md: string
    actions: unknown
    meta: unknown
    created_at: Date
    delivered_at: Date | null
    read_at: Date | null
    email_sent_at: Date | null
}

function rowTo(row: Row): Notification {
    return {
        id: asNotificationId(row.notification_id),
        recipientUserId: asUserId(row.recipient_user_id),
        kind: row.kind,
        severity: row.severity,
        titleMd: row.title_md,
        bodyMd: row.body_md,
        actions: (row.actions as NotificationAction[]) ?? [],
        meta: (row.meta as Record<string, string | number | null>) ?? {},
        createdAt: row.created_at,
        deliveredAt: row.delivered_at,
        readAt: row.read_at,
        emailSentAt: row.email_sent_at,
    }
}

export function notificationCenterDrizzle(): NotificationCenter {
    return {
        async create(draft: NotificationDraft): Promise<Notification> {
            const [row] = await db
                .insert(notifications)
                .values({
                    recipient_user_id: draft.recipientUserId as unknown as number,
                    kind: draft.kind,
                    severity: draft.severity,
                    title_md: draft.titleMd,
                    body_md: draft.bodyMd,
                    actions: draft.actions as unknown as object,
                    meta: (draft.meta ?? {}) as object,
                })
                .returning()
            return rowTo(row as unknown as Row)
        },

        async listForUser(userId: UserId, query?: ListNotificationsQuery) {
            const limit = query?.limit ?? 50
            const conds = [eq(notifications.recipient_user_id, userId as unknown as number)]
            if (query?.unreadOnly) conds.push(isNull(notifications.read_at))
            if (query?.beforeId !== undefined) {
                conds.push(lt(notifications.notification_id, query.beforeId as unknown as number))
            }
            const rows = await db
                .select()
                .from(notifications)
                .where(and(...conds))
                .orderBy(desc(notifications.notification_id))
                .limit(limit)
            return (rows as unknown as Row[]).map(rowTo)
        },

        async findById(id: NotificationId) {
            const [row] = await db
                .select()
                .from(notifications)
                .where(eq(notifications.notification_id, id as unknown as number))
            return row ? rowTo(row as unknown as Row) : null
        },

        async markRead(id: NotificationId) {
            await db
                .update(notifications)
                .set({read_at: new Date()})
                .where(eq(notifications.notification_id, id as unknown as number))
        },

        async markDelivered(id: NotificationId) {
            await db
                .update(notifications)
                .set({delivered_at: new Date()})
                .where(
                    and(
                        eq(notifications.notification_id, id as unknown as number),
                        isNull(notifications.delivered_at),
                    ),
                )
        },

        async markEmailSent(id: NotificationId) {
            await db
                .update(notifications)
                .set({email_sent_at: new Date()})
                .where(eq(notifications.notification_id, id as unknown as number))
        },

        async countUnread(userId: UserId) {
            const [row] = await db
                .select({count: sql<number>`COUNT(*)::int`})
                .from(notifications)
                .where(
                    and(
                        eq(notifications.recipient_user_id, userId as unknown as number),
                        isNull(notifications.read_at),
                    ),
                )
            return Number(row?.count ?? 0)
        },

        async findEmailable(maxAgeMs: number, ageGraceMs: number) {
            const now = Date.now()
            const minCreatedAt = new Date(now - maxAgeMs)
            const maxCreatedAt = new Date(now - ageGraceMs)
            const rows = await db
                .select()
                .from(notifications)
                .where(
                    and(
                        isNull(notifications.delivered_at),
                        isNull(notifications.email_sent_at),
                        sql`${notifications.created_at} >= ${minCreatedAt}`,
                        sql`${notifications.created_at} <= ${maxCreatedAt}`,
                    ),
                )
                .orderBy(desc(notifications.notification_id))
                .limit(200)
            return (rows as unknown as Row[]).map(rowTo)
        },
    }
}
