import {asUserId} from '@/src/domain/shared/id'
import {ackNotificationDelivered, markNotificationRead, NotificationOwnershipError, notifyRecipient} from '..'
import {eventEmitterBus, inMemoryNotificationCenter} from '@/src/adapters/notifications'
import type {Notification, NotificationDraft} from '@/src/domain/notification'
import {NotificationNotFoundError} from '@/src/domain/notification'
import {asNotificationId} from '@/src/domain/shared/id'

const draft = (recipientId = 7): NotificationDraft => ({
    recipientUserId: asUserId(recipientId),
    kind: 'chat_message',
    severity: 'info',
    titleMd: '**Новое сообщение**',
    bodyMd: 'Клиент написал в согласовании #42',
    actions: [{label: 'Открыть', href: '/seller-dashboard/chats?thread=42', style: 'primary'}],
    meta: {threadId: 42},
})

describe('notifyRecipient', () => {
    it('persists notification, publishes to subscribers of that user only', async () => {
        const center = inMemoryNotificationCenter()
        const bus = eventEmitterBus()

        const ownReceived: Notification[] = []
        const otherReceived: Notification[] = []
        bus.subscribe(asUserId(7), (n) => ownReceived.push(n))
        bus.subscribe(asUserId(99), (n) => otherReceived.push(n))

        const created = await notifyRecipient(draft(7), {notificationCenter: center, notificationBus: bus})

        expect(created.id).toBeDefined()
        expect(ownReceived).toHaveLength(1)
        expect(ownReceived[0].id).toBe(created.id)
        expect(otherReceived).toHaveLength(0)

        const list = await center.listForUser(asUserId(7))
        expect(list).toHaveLength(1)
        expect(await center.countUnread(asUserId(7))).toBe(1)
    })
})

describe('markNotificationRead', () => {
    it('updates readAt for owner; rejects others', async () => {
        const center = inMemoryNotificationCenter()
        const bus = eventEmitterBus()
        const created = await notifyRecipient(draft(7), {notificationCenter: center, notificationBus: bus})

        await expect(
            markNotificationRead(
                {notificationId: created.id, actingUserId: asUserId(99)},
                {notificationCenter: center},
            ),
        ).rejects.toThrow(NotificationOwnershipError)

        await markNotificationRead(
            {notificationId: created.id, actingUserId: asUserId(7)},
            {notificationCenter: center},
        )
        expect(await center.countUnread(asUserId(7))).toBe(0)
        const refetched = await center.findById(created.id)
        expect(refetched?.readAt).not.toBeNull()
    })

    it('throws NotFound for unknown id', async () => {
        const center = inMemoryNotificationCenter()
        await expect(
            markNotificationRead(
                {notificationId: asNotificationId(999), actingUserId: asUserId(1)},
                {notificationCenter: center},
            ),
        ).rejects.toThrow(NotificationNotFoundError)
    })
})

describe('ackNotificationDelivered', () => {
    it('records deliveredAt and disables email-fallback eligibility', async () => {
        const center = inMemoryNotificationCenter()
        const bus = eventEmitterBus()
        const created = await notifyRecipient(draft(7), {notificationCenter: center, notificationBus: bus})

        const beforeFlush = await center.findEmailable(60_000, 0)
        expect(beforeFlush.map((n) => n.id)).toContain(created.id)

        await ackNotificationDelivered(
            {notificationId: created.id, actingUserId: asUserId(7)},
            {notificationCenter: center},
        )

        const afterFlush = await center.findEmailable(60_000, 0)
        expect(afterFlush.map((n) => n.id)).not.toContain(created.id)
    })
})

describe('findEmailable', () => {
    it('skips notifications already delivered or already emailed', async () => {
        const center = inMemoryNotificationCenter()
        const bus = eventEmitterBus()
        const a = await notifyRecipient(draft(7), {notificationCenter: center, notificationBus: bus})
        const b = await notifyRecipient(draft(7), {notificationCenter: center, notificationBus: bus})
        await center.markDelivered(a.id)
        await center.markEmailSent(b.id)
        const emailable = await center.findEmailable(60_000, 0)
        expect(emailable).toHaveLength(0)
    })
})
