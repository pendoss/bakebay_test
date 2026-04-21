import type {Notification, NotificationDraft} from '@/src/domain/notification'
import type {NotificationId, UserId} from '@/src/domain/shared/id'

export interface ListNotificationsQuery {
    readonly limit?: number
    readonly beforeId?: NotificationId
    readonly unreadOnly?: boolean
}

export interface NotificationCenter {
    create(draft: NotificationDraft): Promise<Notification>

    listForUser(userId: UserId, query?: ListNotificationsQuery): Promise<Notification[]>

    findById(id: NotificationId): Promise<Notification | null>

    markRead(id: NotificationId): Promise<void>

    markDelivered(id: NotificationId): Promise<void>

    markEmailSent(id: NotificationId): Promise<void>

    countUnread(userId: UserId): Promise<number>

    findEmailable(maxAgeMs: number, ageGraceMs: number): Promise<Notification[]>
}
