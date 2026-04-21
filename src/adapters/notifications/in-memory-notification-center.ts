import type {Notification, NotificationDraft} from '@/src/domain/notification'
import type {
    ListNotificationsQuery,
    NotificationCenter,
} from '@/src/application/ports/notification-center'
import {asNotificationId} from '@/src/domain/shared/id'
import type {NotificationId, UserId} from '@/src/domain/shared/id'

export function inMemoryNotificationCenter(): NotificationCenter & {
    readonly snapshot: () => Notification[]
} {
    const list: Notification[] = []
    let seq = 0

    function findIndex(id: NotificationId): number {
        return list.findIndex((n) => n.id === id)
    }

    return {
        async create(draft: NotificationDraft): Promise<Notification> {
            seq += 1
            const created: Notification = {
                ...draft,
                id: asNotificationId(seq),
                createdAt: new Date(),
                deliveredAt: null,
                readAt: null,
                emailSentAt: null,
            }
            list.push(created)
            return created
        },

        async listForUser(userId: UserId, query?: ListNotificationsQuery) {
            const limit = query?.limit ?? 50
            return list
                .filter((n) => n.recipientUserId === userId)
                .filter((n) => (query?.unreadOnly ? n.readAt === null : true))
                .filter((n) =>
                    query?.beforeId !== undefined
                        ? (n.id as unknown as number) < (query.beforeId as unknown as number)
                        : true,
                )
                .sort((a, b) => (b.id as unknown as number) - (a.id as unknown as number))
                .slice(0, limit)
        },

        async findById(id: NotificationId) {
            return list.find((n) => n.id === id) ?? null
        },

        async markRead(id: NotificationId) {
            const idx = findIndex(id)
            if (idx === -1) return
            list[idx] = {...list[idx], readAt: new Date()}
        },

        async markDelivered(id: NotificationId) {
            const idx = findIndex(id)
            if (idx === -1) return
            if (list[idx].deliveredAt) return
            list[idx] = {...list[idx], deliveredAt: new Date()}
        },

        async markEmailSent(id: NotificationId) {
            const idx = findIndex(id)
            if (idx === -1) return
            list[idx] = {...list[idx], emailSentAt: new Date()}
        },

        async countUnread(userId: UserId) {
            return list.filter((n) => n.recipientUserId === userId && n.readAt === null).length
        },

        async findEmailable(maxAgeMs: number, ageGraceMs: number) {
            const now = Date.now()
            return list.filter((n) => {
                if (n.deliveredAt !== null) return false
                if (n.emailSentAt !== null) return false
                const age = now - n.createdAt.getTime()
                return age >= ageGraceMs && age <= maxAgeMs
            })
        },

        snapshot() {
            return list.slice()
        },
    }
}
