import type {NotificationId, UserId} from '@/src/domain/shared/id'
import {NotificationNotFoundError} from '@/src/domain/notification'
import type {NotificationCenter} from '@/src/application/ports/notification-center'

export class NotificationOwnershipError extends Error {
    constructor(id: NotificationId, userId: UserId) {
        super(`Notification ${id} does not belong to user ${userId}`)
        this.name = 'NotificationOwnershipError'
    }
}

export interface MarkNotificationReadInput {
    readonly notificationId: NotificationId
    readonly actingUserId: UserId
}

export interface MarkNotificationReadDeps {
    notificationCenter: NotificationCenter
}

export async function markNotificationRead(
    input: MarkNotificationReadInput,
    deps: MarkNotificationReadDeps,
): Promise<void> {
    const found = await deps.notificationCenter.findById(input.notificationId)
    if (!found) throw new NotificationNotFoundError(input.notificationId)
    if (found.recipientUserId !== input.actingUserId) {
        throw new NotificationOwnershipError(input.notificationId, input.actingUserId)
    }
    if (found.readAt) return
    await deps.notificationCenter.markRead(input.notificationId)
}

export interface AckNotificationDeliveredDeps {
    notificationCenter: NotificationCenter
}

export async function ackNotificationDelivered(
    input: MarkNotificationReadInput,
    deps: AckNotificationDeliveredDeps,
): Promise<void> {
    const found = await deps.notificationCenter.findById(input.notificationId)
    if (!found) throw new NotificationNotFoundError(input.notificationId)
    if (found.recipientUserId !== input.actingUserId) {
        throw new NotificationOwnershipError(input.notificationId, input.actingUserId)
    }
    if (found.deliveredAt) return
    await deps.notificationCenter.markDelivered(input.notificationId)
}
