import {NextResponse} from 'next/server'
import {notificationCenterDrizzle} from '@/src/adapters/storage/drizzle'
import {
    ackNotificationDelivered,
    NotificationOwnershipError,
} from '@/src/application/use-cases/notification'
import {asNotificationId, asUserId} from '@/src/domain/shared/id'
import {NotificationNotFoundError} from '@/src/domain/notification'
import {getAuthPayload} from '@/app/api/get-auth'

export async function POST(_request: Request, {params}: { params: Promise<{ id: string }> }) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const {id} = await params
    try {
        await ackNotificationDelivered(
            {notificationId: asNotificationId(Number(id)), actingUserId: asUserId(auth.userId)},
            {notificationCenter: notificationCenterDrizzle()},
        )
        return NextResponse.json({ok: true})
    } catch (err) {
        if (err instanceof NotificationOwnershipError) return NextResponse.json({error: err.message}, {status: 403})
        if (err instanceof NotificationNotFoundError) return NextResponse.json({error: err.message}, {status: 404})
        const msg = err instanceof Error ? err.message : 'ack failed'
        return NextResponse.json({error: msg}, {status: 400})
    }
}
