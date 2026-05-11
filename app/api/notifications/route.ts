import {NextResponse} from 'next/server'
import {notificationCenterDrizzle} from '@/src/adapters/storage/drizzle'
import {asNotificationId, asUserId} from '@/src/domain/shared/id'
import {getAuthPayload} from '@/app/api/get-auth'

export async function GET(request: Request) {
    const auth = await getAuthPayload()
    if (!auth) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

    const url = new URL(request.url)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 50)))
    const beforeIdRaw = url.searchParams.get('beforeId')
    const beforeId = beforeIdRaw ? asNotificationId(Number(beforeIdRaw)) : undefined
    const unreadOnly = url.searchParams.get('unreadOnly') === '1'

    const center = notificationCenterDrizzle()
    const userId = asUserId(auth.userId)
    const list = await center.listForUser(userId, {limit, beforeId, unreadOnly})
    const unread = await center.countUnread(userId)
    return NextResponse.json({notifications: list, unreadCount: unread})
}
