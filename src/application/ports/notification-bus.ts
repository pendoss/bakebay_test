import type {Notification} from '@/src/domain/notification'
import type {UserId} from '@/src/domain/shared/id'

export type NotificationBusListener = (notification: Notification) => void

export interface NotificationBus {
    publish(notification: Notification): void

    subscribe(userId: UserId, listener: NotificationBusListener): () => void
}
