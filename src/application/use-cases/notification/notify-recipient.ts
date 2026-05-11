import type {Notification, NotificationDraft} from '@/src/domain/notification'
import type {NotificationCenter} from '@/src/application/ports/notification-center'
import type {NotificationBus} from '@/src/application/ports/notification-bus'

export interface NotifyRecipientDeps {
    notificationCenter: NotificationCenter
    notificationBus: NotificationBus
}

export async function notifyRecipient(
    draft: NotificationDraft,
    deps: NotifyRecipientDeps,
): Promise<Notification> {
    const notification = await deps.notificationCenter.create(draft)
    deps.notificationBus.publish(notification)
    return notification
}
