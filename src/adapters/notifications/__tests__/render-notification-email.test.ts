import {asNotificationId, asUserId} from '@/src/domain/shared/id'
import {renderNotificationEmail} from '../render-notification-email'
import type {Notification} from '@/src/domain/notification'

const sample: Notification = {
    id: asNotificationId(1),
    recipientUserId: asUserId(7),
    kind: 'chat_message',
    severity: 'info',
    titleMd: '**Сообщение от клиента**',
    bodyMd: 'Привет, можно поменять `шоколад` на белый?',
    actions: [
        {label: 'Открыть', href: '/seller-dashboard/chats?thread=42', style: 'primary'},
        {label: 'Архив', href: 'https://example.com/archive'},
    ],
    meta: {threadId: 42},
    createdAt: new Date('2026-04-21T12:00:00Z'),
    deliveredAt: null,
    readAt: null,
    emailSentAt: null,
}

describe('renderNotificationEmail', () => {
    it('renders bold inline markdown and inlines actions', () => {
        const msg = renderNotificationEmail(sample, 'seller@example.com', 'https://app.bakebay.dev')
        expect(msg.subject).toBe('Сообщение от клиента')
        expect(msg.html).toContain('<strong>Сообщение от клиента</strong>')
        expect(msg.html).toContain('<code>шоколад</code>')
        expect(msg.html).toContain('https://app.bakebay.dev/seller-dashboard/chats?thread=42')
        expect(msg.html).toContain('https://example.com/archive')
        expect(msg.text).toContain('Открыть: https://app.bakebay.dev/seller-dashboard/chats?thread=42')
    })

    it('escapes user-provided html', () => {
        const dangerous = {...sample, bodyMd: '<script>alert(1)</script>'}
        const msg = renderNotificationEmail(dangerous, 'x@y.com')
        expect(msg.html).not.toContain('<script>')
        expect(msg.html).toContain('&lt;script&gt;')
    })
})
