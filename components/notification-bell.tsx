'use client'

import {Bell, CheckCheck} from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {ScrollArea} from '@/components/ui/scroll-area'
import {
    type NotificationDTO,
    type NotificationSeverityDTO,
    useNotificationCenter,
} from '@/src/adapters/ui/react/hooks/use-notification-center'

const SEVERITY_TONE: Record<NotificationSeverityDTO, string> = {
    info: 'border-l-2 border-lavender-dessert',
    success: 'border-l-2 border-mint-frosting',
    warning: 'border-l-2 border-caramel-light',
    error: 'border-l-2 border-destructive',
}

function formatTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleString('ru-RU', {dateStyle: 'short', timeStyle: 'short'})
}

export function NotificationBell() {
    const {notifications, unreadCount, markRead, markAllRead} = useNotificationCenter()

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant='ghost' size='icon' className='relative' aria-label='Уведомления'>
                    <Bell className='h-5 w-5'/>
                    {unreadCount > 0 && (
                        <Badge
                            variant='destructive'
                            className='absolute -top-1 -right-1 h-5 min-w-5 rounded-full p-0 px-1 text-xs flex items-center justify-center'
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-96 p-0'>
                <div className='flex items-center justify-between border-b p-3'>
                    <span className='font-semibold'>Уведомления</span>
                    {unreadCount > 0 && (
                        <Button variant='ghost' size='sm' className='h-8 gap-1' onClick={() => markAllRead()}>
                            <CheckCheck className='h-4 w-4'/>
                            Прочитать все
                        </Button>
                    )}
                </div>
                <ScrollArea className='max-h-[420px]'>
                    {notifications.length === 0 ? (
                        <p className='p-6 text-center text-sm text-muted-foreground'>Нет уведомлений</p>
                    ) : (
                        <ul className='divide-y'>
                            {notifications.map((n) => (
                                <NotificationItem key={n.id} notification={n} onRead={markRead}/>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}

interface NotificationItemProps {
    notification: NotificationDTO
    onRead: (id: number) => void
}

function NotificationItem({notification, onRead}: NotificationItemProps) {
    const isUnread = !notification.readAt
    return (
        <li className={`p-3 ${SEVERITY_TONE[notification.severity]} ${isUnread ? 'bg-lavender-dessert/10' : ''}`}>
            <div className='flex items-start justify-between gap-2'>
                <div className='prose prose-sm max-w-none flex-1'>
                    <ReactMarkdown>{notification.titleMd}</ReactMarkdown>
                </div>
                <span className='text-xs text-muted-foreground whitespace-nowrap'>
                    {formatTime(notification.createdAt)}
                </span>
            </div>
            {notification.bodyMd && (
                <div className='prose prose-sm max-w-none mt-1 text-sm text-muted-foreground'>
                    <ReactMarkdown>{notification.bodyMd}</ReactMarkdown>
                </div>
            )}
            {notification.actions.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-2'>
                    {notification.actions.map((action, idx) => (
                        <Link
                            key={`${action.href}-${idx}`}
                            href={action.href}
                            onClick={() => onRead(notification.id)}
                            className='inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-muted'
                        >
                            {action.label}
                        </Link>
                    ))}
                </div>
            )}
            {isUnread && (
                <button
                    type='button'
                    onClick={() => onRead(notification.id)}
                    className='mt-2 text-xs text-muted-foreground hover:text-foreground'
                >
                    Пометить прочитанным
                </button>
            )}
        </li>
    )
}
