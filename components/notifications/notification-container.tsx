'use client'

/**
 * NotificationContainer — стек всплывающих уведомлений в правом верхнем
 * углу, рядом с колокольчиком. Три верхние карточки видны всегда —
 * накладываются друг на друга лёгким сдвигом и масштабом. На hover
 * стек раскрывается вертикально, остальные уведомления скрыты в
 * счётчик «+N».
 */

import {useState} from 'react'
import {useNotifications} from '@/contexts/notification-context'
import {NotificationToast} from './notification-toast'

const VISIBLE_STACK = 3

export function NotificationContainer() {
    const {notifications, dismiss} = useNotifications()
    const [hovered, setHovered] = useState(false)

    if (notifications.length === 0) return null

    const visible = notifications.slice(0, VISIBLE_STACK)
    const hiddenCount = Math.max(0, notifications.length - VISIBLE_STACK)

    return (
        <div
            aria-live='polite'
            aria-label='Уведомления'
            className='fixed top-20 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] pointer-events-none'
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className='relative pointer-events-auto'>
                {visible.map((n, i) => {
                    const style: React.CSSProperties = hovered
                        ? {
                            transform: 'translateY(0) scale(1)',
                            opacity: 1,
                            marginBottom: i < visible.length - 1 ? 8 : 0,
                            zIndex: visible.length - i,
                        }
                        : {
                            position: i === 0 ? 'relative' : 'absolute',
                            top: i * 10,
                            right: 0,
                            left: 0,
                            transform: `scale(${1 - i * 0.04})`,
                            opacity: 1 - i * 0.08,
                            transformOrigin: 'top right',
                            zIndex: visible.length - i,
                        }
                    return (
                        <div
                            key={n.id}
                            className='transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform'
                            style={style}
                        >
                            <NotificationToast notification={n} onDismiss={dismiss}/>
                        </div>
                    )
                })}
                {hiddenCount > 0 && !hovered && (
                    <div
                        className='absolute left-0 right-0 text-center pointer-events-none transition-opacity duration-200'
                        style={{top: visible.length * 10 + 4}}
                    >
                        <span className='inline-block rounded-full bg-white/90 backdrop-blur-sm border border-black/5 px-3 py-1 text-[11px] font-medium text-secondary shadow-sm'>
                            ещё {hiddenCount}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
