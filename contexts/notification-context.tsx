"use client"

import {createContext, useContext, useState, useCallback, useRef, type ReactNode} from "react"
import {
    AppNotification,
    NotificationType,
    NOTIFICATION_CONFIGS,
    playSound,
} from "@/lib/notifications"

// ── Типы ──────────────────────────────────────────────────────────────────────

export interface NotifyOptions {
    title: string
    description: string
    deeplink?: string
}

interface NotificationContextType {
    notifications: AppNotification[]
    notify: (type: NotificationType, opts: NotifyOptions) => void
    dismiss: (id: string) => void
    dismissAll: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
    const ctx = useContext(NotificationContext)
    if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider")
    return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 5

export function NotificationProvider({children}: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

    const dismiss = useCallback((id: string) => {
        clearTimeout(timers.current[id])
        delete timers.current[id]
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const dismissAll = useCallback(() => {
        Object.values(timers.current).forEach(clearTimeout)
        timers.current = {}
        setNotifications([])
    }, [])

    const notify = useCallback(
        (type: NotificationType, opts: NotifyOptions) => {
            const config = NOTIFICATION_CONFIGS[type]
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

            const notification: AppNotification = {
                id,
                type,
                title: opts.title,
                description: opts.description,
                deeplink: opts.deeplink,
                createdAt: Date.now(),
            }

            playSound(config.sound)

            // Добавляем новое уведомление в начало стека (max MAX_VISIBLE)
            setNotifications(prev => [notification, ...prev].slice(0, MAX_VISIBLE))

            if (config.duration > 0) {
                timers.current[id] = setTimeout(() => dismiss(id), config.duration)
            }
        },
        [dismiss],
    )

    return (
        <NotificationContext.Provider value={{notifications, notify, dismiss, dismissAll}}>
            {children}
        </NotificationContext.Provider>
    )
}
