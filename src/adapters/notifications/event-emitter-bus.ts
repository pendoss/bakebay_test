import {EventEmitter} from 'node:events'
import type {Notification} from '@/src/domain/notification'
import type {
    NotificationBus,
    NotificationBusListener,
} from '@/src/application/ports/notification-bus'
import type {UserId} from '@/src/domain/shared/id'

export function eventEmitterBus(): NotificationBus {
    const emitter = new EventEmitter()
    emitter.setMaxListeners(0)

    return {
        publish(notification: Notification) {
            const channel = `user:${notification.recipientUserId as unknown as number}`
            emitter.emit(channel, notification)
        },

        subscribe(userId: UserId, listener: NotificationBusListener) {
            const channel = `user:${userId as unknown as number}`
            emitter.on(channel, listener)
            return () => {
                emitter.off(channel, listener)
            }
        },
    }
}

let singleton: NotificationBus | null = null

export function sharedEventEmitterBus(): NotificationBus {
    if (!singleton) singleton = eventEmitterBus()
    return singleton
}
