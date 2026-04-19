'use client'

/**
 * NotificationContainer — фиксированный стек уведомлений вверху по центру.
 *
 * Уведомления накладываются друг на друга (collapsed), при наведении
 * курсора раскрываются и видны все.
 */

import {useState} from 'react'
import {useNotifications} from '@/contexts/notification-context'
import {NotificationToast} from './notification-toast'

export function NotificationContainer() {
    const {notifications, dismiss} = useNotifications()
    const [hovered, setHovered] = useState(false)

    if (notifications.length === 0) return null

    return (
        <div
            aria-live='polite'
            aria-label='Уведомления'
            className='fixed top-4 left-1/2 -translate-x-1/2 z-50 w-96 max-w-[calc(100vw-2rem)]'
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className='relative'>
                {notifications.map((n, i) => (
                    <div
                        key={n.id}
                        className='transition-all duration-300 ease-out'
                        style={
                            hovered
                                ? {marginBottom: i < notifications.length - 1 ? 8 : 0}
                                : {
                                    position: i === 0 ? 'relative' : 'absolute',
                                    top: i * 6,
                                    left: 0,
                                    right: 0,
                                    zIndex: notifications.length - i,
                                    opacity: Math.max(1 - i * 0.15, 0.4),
                                    transform: `scale(${Math.max(1 - i * 0.03, 0.9)})`,
                                    transformOrigin: 'top center',
                                }
                        }
                    >
                        <NotificationToast notification={n} onDismiss={dismiss}/>
                    </div>
                ))}
            </div>
        </div>
    )
}
