'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {useNotifications} from '@/contexts/notification-context'
import type {NotificationType} from '@/lib/notifications'

export type NotificationKindDTO =
    | 'chat_message'
    | 'chat_offer'
    | 'chat_finalized'
    | 'customer_accept'
    | 'seller_order_paid_reminder'
    | 'ingredient_low'
    | 'ingredient_out'
    | 'refund_requested'
    | 'refund_approved'

export type NotificationSeverityDTO = 'info' | 'success' | 'warning' | 'error'

export interface NotificationActionDTO {
    label: string
    href: string
    style?: 'primary' | 'secondary' | 'destructive'
}

export interface NotificationDTO {
    id: number
    recipientUserId: number
    kind: NotificationKindDTO
    severity: NotificationSeverityDTO
    titleMd: string
    bodyMd: string
    actions: NotificationActionDTO[]
    meta?: Record<string, string | number | null>
    createdAt: string
    deliveredAt: string | null
    readAt: string | null
    emailSentAt: string | null
}

interface FetchedListResponse {
    notifications: NotificationDTO[]
    unreadCount: number
}

const MAX_KEEP = 100

// Дедупим показ тостов между несколькими параллельными подписчиками
// (например, bell + страница /notifications) — SSE по одному пользователю
// шлёт одно и то же, но каждый instance hook получит событие независимо.
const toastSeenIds = new Set<number>()

function toastTypeFor(kind: NotificationKindDTO, severity: NotificationSeverityDTO): NotificationType {
    if (kind === 'ingredient_out') return 'ingredient_out'
    if (kind === 'ingredient_low') return 'ingredient_low'
    if (kind === 'chat_message' || kind === 'chat_offer') return 'order_status'
    if (kind === 'customer_accept' || kind === 'chat_finalized') return 'new_order'
    if (kind === 'refund_requested') return 'order_status'
    if (kind === 'refund_approved') return 'order_status'
    if (kind === 'seller_order_paid_reminder') return 'order_status'
    if (severity === 'error') return 'ingredient_out'
    if (severity === 'warning') return 'ingredient_low'
    if (severity === 'success') return 'new_order'
    return 'order_status'
}

function stripMd(input: string): string {
    return input
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .trim()
}

export function useNotificationCenter() {
    const [notifications, setNotifications] = useState<NotificationDTO[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [connected, setConnected] = useState(false)
    const sourceRef = useRef<EventSource | null>(null)
    const {notify} = useNotifications()
    const seededSince = useRef<number | null>(null)

    const merge = useCallback((incoming: NotificationDTO) => {
        setNotifications((prev) => {
            if (prev.some((n) => n.id === incoming.id)) return prev
            const next = [incoming, ...prev].slice(0, MAX_KEEP)
            return next
        })
        if (!incoming.readAt) setUnreadCount((c) => c + 1)
    }, [])

    const reload = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications', {credentials: 'include'})
            if (!res.ok) return
            const data = (await res.json()) as FetchedListResponse
            setNotifications(data.notifications)
            setUnreadCount(data.unreadCount)
            // Всё, что было при первой загрузке, — baseline: не поднимаем
            // тосты ретроактивно. Только действительно новые события SSE
            // будут показаны как тост.
            if (seededSince.current === null) {
                const maxId = data.notifications.reduce((m, n) => (n.id > m ? n.id : m), 0)
                seededSince.current = maxId
                for (const n of data.notifications) toastSeenIds.add(n.id)
            }
        } catch {
            /* offline / mocked-fetch — keep current state */
        }
    }, [])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load + SSE subscription
        void reload()
        if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') return
        const source = new window.EventSource('/api/notifications/stream', {withCredentials: true})
        sourceRef.current = source
        source.addEventListener('hello', () => setConnected(true))
        source.addEventListener('notification', (event) => {
            const data = JSON.parse((event as MessageEvent).data) as NotificationDTO
            merge(data)
            // Тост показываем один раз на уведомление, даже если параллельно
            // работают несколько инстансов хука. Baseline (loaded snapshot)
            // тостами не поднимаем.
            const seededBefore = seededSince.current ?? 0
            if (data.id > seededBefore && !toastSeenIds.has(data.id)) {
                toastSeenIds.add(data.id)
                notify(toastTypeFor(data.kind, data.severity), {
                    title: stripMd(data.titleMd),
                    description: stripMd(data.bodyMd),
                    deeplink: data.actions[0]?.href,
                })
            }
            void fetch(`/api/notifications/${data.id}/ack`, {method: 'POST', credentials: 'include'}).catch(() => {})
        })
        source.onerror = () => setConnected(false)
        return () => {
            source.close()
            sourceRef.current = null
        }
    }, [merge, notify, reload])

    const markRead = useCallback(async (id: number) => {
        await fetch(`/api/notifications/${id}/read`, {method: 'POST', credentials: 'include'})
        setNotifications((prev) =>
            prev.map((n) => (n.id === id && !n.readAt ? {...n, readAt: new Date().toISOString()} : n)),
        )
        setUnreadCount((c) => Math.max(0, c - 1))
    }, [])

    const markAllRead = useCallback(async () => {
        const unread = notifications.filter((n) => !n.readAt)
        await Promise.all(
            unread.map((n) =>
                fetch(`/api/notifications/${n.id}/read`, {method: 'POST', credentials: 'include'}),
            ),
        )
        setNotifications((prev) =>
            prev.map((n) => (n.readAt ? n : {...n, readAt: new Date().toISOString()})),
        )
        setUnreadCount(0)
    }, [notifications])

    return {notifications, unreadCount, connected, reload, markRead, markAllRead}
}
