import {sharedEventEmitterBus} from '@/src/adapters/notifications/event-emitter-bus'
import {notificationCenterDrizzle} from '@/src/adapters/storage/drizzle'
import {asUserId} from '@/src/domain/shared/id'
import {getAuthPayload} from '@/app/api/get-auth'
import type {Notification} from '@/src/domain/notification'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HEARTBEAT_MS = 15_000

function format(event: string, data: unknown, id?: number | string): string {
    const lines = [`event: ${event}`]
    if (id !== undefined) lines.push(`id: ${id}`)
    lines.push(`data: ${JSON.stringify(data)}`)
    return lines.join('\n') + '\n\n'
}

export async function GET(request: Request) {
    const auth = await getAuthPayload()
    if (!auth) return new Response('Unauthorized', {status: 401})

    const userId = asUserId(auth.userId)
    const lastEventIdHeader = request.headers.get('last-event-id')
    const lastEventId = lastEventIdHeader ? Number(lastEventIdHeader) : NaN
    const center = notificationCenterDrizzle()
    const bus = sharedEventEmitterBus()

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const encoder = new TextEncoder()

            const send = (chunk: string) => {
                try {
                    controller.enqueue(encoder.encode(chunk))
                } catch {
                    /* stream closed */
                }
            }

            send(format('hello', {userId: userId as unknown as number}))

            // Replay missed notifications since last-event-id (or 25 most recent on first connect).
            const replay = await center.listForUser(userId, {limit: 25})
            const missed = Number.isFinite(lastEventId)
                ? replay.filter((n) => (n.id as unknown as number) > lastEventId).reverse()
                : replay.reverse()
            for (const n of missed) {
                send(format('notification', n, n.id as unknown as number))
            }

            const unsubscribe = bus.subscribe(userId, (n: Notification) => {
                send(format('notification', n, n.id as unknown as number))
            })

            const heartbeat = setInterval(() => {
                send(`: heartbeat ${Date.now()}\n\n`)
            }, HEARTBEAT_MS)

            const abort = () => {
                clearInterval(heartbeat)
                unsubscribe()
                try {
                    controller.close()
                } catch {
                    /* already closed */
                }
            }
            request.signal.addEventListener('abort', abort)
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    })
}
