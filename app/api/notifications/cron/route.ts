import {NextResponse} from 'next/server'
import {and, eq, isNull, sql} from 'drizzle-orm'
import {
    customerOrders,
    db,
    notificationCenterDrizzle,
    notifications,
    sellerOrders,
} from '@/src/adapters/storage/drizzle'
import {sharedEventEmitterBus} from '@/src/adapters/notifications/event-emitter-bus'
import {nodemailerEmailGateway} from '@/src/adapters/notifications/nodemailer-email-gateway'
import {flushPendingEmails} from '@/src/adapters/notifications/email-flusher'
import {notifyRecipient} from '@/src/application/use-cases/notification'
import {asUserId} from '@/src/domain/shared/id'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const REMINDER_AGE_HOURS = Number(process.env.NOTIFY_PAYMENT_REMINDER_HOURS ?? 6)
const REMINDER_DEDUP_HOURS = Number(process.env.NOTIFY_PAYMENT_REMINDER_DEDUP_HOURS ?? 12)

function sharedSecret(): string | null {
    return process.env.NOTIFY_CRON_SECRET ?? null
}

export async function POST(request: Request) {
    const expected = sharedSecret()
    if (expected) {
        const got = request.headers.get('x-cron-secret')
        if (got !== expected) return NextResponse.json({error: 'forbidden'}, {status: 403})
    }

    const center = notificationCenterDrizzle()
    const bus = sharedEventEmitterBus()

    const candidates = await db
        .select({
            sellerOrderId: sellerOrders.seller_order_id,
            userId: customerOrders.user_id,
        })
        .from(sellerOrders)
        .innerJoin(
            customerOrders,
            eq(sellerOrders.customer_order_id, customerOrders.customer_order_id),
        )
        .where(
            and(
                eq(sellerOrders.status, 'confirmed'),
                isNull(sellerOrders.paid_at),
                sql`${sellerOrders.updated_at} <= now() - (${REMINDER_AGE_HOURS} || ' hours')::interval`,
            ),
        )

    let sent = 0
    for (const cand of candidates) {
        const dedupRows = await db
            .select({id: notifications.notification_id})
            .from(notifications)
            .where(
                and(
                    eq(notifications.recipient_user_id, cand.userId),
                    eq(notifications.kind, 'seller_order_paid_reminder'),
                    sql`${notifications.created_at} >= now() - (${REMINDER_DEDUP_HOURS} || ' hours')::interval`,
                    sql`${notifications.meta} ->> 'sellerOrderId' = ${String(cand.sellerOrderId)}`,
                ),
            )
            .limit(1)
        if (dedupRows.length > 0) continue

        await notifyRecipient(
            {
                recipientUserId: asUserId(cand.userId),
                kind: 'seller_order_paid_reminder',
                severity: 'warning',
                titleMd: '**Подзаказ ждёт оплаты**',
                bodyMd: 'Продавец зафиксировал условия. Без оплаты подзаказ может быть отменён по таймауту.',
                actions: [{label: 'Оплатить', href: '/orders-v2', style: 'primary'}],
                meta: {sellerOrderId: cand.sellerOrderId},
            },
            {notificationCenter: center, notificationBus: bus},
        )
        sent += 1
    }

    const flushed = await flushPendingEmails({
        notificationCenter: center,
        emailGateway: nodemailerEmailGateway(),
    })

    return NextResponse.json({remindersSent: sent, emailsSent: flushed})
}
