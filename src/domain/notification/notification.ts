import type {NotificationId, UserId} from '@/src/domain/shared/id'

export type NotificationKind =
    | 'chat_message'
    | 'chat_offer'
    | 'chat_finalized'
    | 'customer_accept'
    | 'seller_order_paid_reminder'
    | 'ingredient_low'
    | 'ingredient_out'
    | 'refund_requested'
    | 'refund_approved'

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error'

export type NotificationActionStyle = 'primary' | 'secondary' | 'destructive'

export interface NotificationAction {
    readonly label: string
    readonly href: string
    readonly style?: NotificationActionStyle
}

export interface NotificationDraft {
    readonly recipientUserId: UserId
    readonly kind: NotificationKind
    readonly severity: NotificationSeverity
    readonly titleMd: string
    readonly bodyMd: string
    readonly actions: ReadonlyArray<NotificationAction>
    readonly meta?: Readonly<Record<string, string | number | null>>
}

export interface Notification extends NotificationDraft {
    readonly id: NotificationId
    readonly createdAt: Date
    readonly deliveredAt: Date | null
    readonly readAt: Date | null
    readonly emailSentAt: Date | null
}

export class NotificationNotFoundError extends Error {
    constructor(id: NotificationId) {
        super(`Notification ${id} not found`)
        this.name = 'NotificationNotFoundError'
    }
}
