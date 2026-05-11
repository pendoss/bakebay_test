import {eq} from 'drizzle-orm'
import {db, users} from '@/src/adapters/storage/drizzle'
import type {Notification} from '@/src/domain/notification'
import type {NotificationCenter} from '@/src/application/ports/notification-center'
import type {EmailGateway} from '@/src/application/ports/email-gateway'
import {renderNotificationEmail} from './render-notification-email'

const DEFAULT_GRACE_MS = Number(process.env.NOTIFY_EMAIL_GRACE_MS ?? 60_000)
const DEFAULT_MAX_AGE_MS = Number(process.env.NOTIFY_EMAIL_MAX_AGE_MS ?? 24 * 60 * 60_000)

export interface FlushPendingEmailsDeps {
    notificationCenter: NotificationCenter
    emailGateway: EmailGateway
    publicBaseUrl?: string
}

export async function flushPendingEmails(deps: FlushPendingEmailsDeps): Promise<number> {
    const candidates = await deps.notificationCenter.findEmailable(DEFAULT_MAX_AGE_MS, DEFAULT_GRACE_MS)
    let sent = 0
    for (const notification of candidates) {
        const recipient = await loadRecipientEmail(notification)
        if (!recipient) {
            await deps.notificationCenter.markEmailSent(notification.id)
            continue
        }
        const message = renderNotificationEmail(notification, recipient.email, deps.publicBaseUrl)
        try {
            await deps.emailGateway.send(message)
            await deps.notificationCenter.markEmailSent(notification.id)
            sent += 1
        } catch (err) {
            console.warn('[email] failed for notification', notification.id, err)
        }
    }
    return sent
}

async function loadRecipientEmail(notification: Notification): Promise<{email: string} | null> {
    const [row] = await db
        .select({email: users.email})
        .from(users)
        .where(eq(users.user_id, notification.recipientUserId as unknown as number))
    return row ?? null
}
