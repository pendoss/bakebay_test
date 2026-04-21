'use client'

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {useNotificationCenter} from '@/src/adapters/ui/react/hooks/use-notification-center'

const SEVERITY_TONE: Record<string, string> = {
    info: 'border-l-4 border-lavender-dessert',
    success: 'border-l-4 border-mint-frosting',
    warning: 'border-l-4 border-caramel-light',
    error: 'border-l-4 border-destructive',
}

export default function SellerNotificationsPage() {
    const {notifications, unreadCount, markRead, markAllRead} = useNotificationCenter()

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>Уведомления</h2>
                    <p className='text-muted-foreground'>Все обновления по согласованиям и складу</p>
                </div>
                {unreadCount > 0 && (
                    <Button variant='outline' onClick={() => markAllRead()}>Прочитать все ({unreadCount})</Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <p className='text-center text-muted-foreground py-12'>Уведомлений пока нет.</p>
            ) : (
                <ul className='space-y-3'>
                    {notifications.map((n) => (
                        <li key={n.id}>
                            <Card className={`p-4 ${SEVERITY_TONE[n.severity] ?? ''} ${n.readAt ? '' : 'bg-lavender-dessert/10'}`}>
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='prose prose-sm max-w-none flex-1'>
                                        <ReactMarkdown>{n.titleMd}</ReactMarkdown>
                                    </div>
                                    <span className='text-xs text-muted-foreground whitespace-nowrap'>
                                        {new Date(n.createdAt).toLocaleString('ru-RU')}
                                    </span>
                                </div>
                                {n.bodyMd && (
                                    <div className='prose prose-sm max-w-none mt-2 text-sm text-muted-foreground'>
                                        <ReactMarkdown>{n.bodyMd}</ReactMarkdown>
                                    </div>
                                )}
                                {n.actions.length > 0 && (
                                    <div className='mt-3 flex flex-wrap gap-2'>
                                        {n.actions.map((a, i) => (
                                            <Link
                                                key={`${a.href}-${i}`}
                                                href={a.href}
                                                onClick={() => markRead(n.id)}
                                                className='inline-flex items-center rounded-md border px-3 py-1 text-sm hover:bg-muted'
                                            >
                                                {a.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {!n.readAt && (
                                    <button
                                        type='button'
                                        onClick={() => markRead(n.id)}
                                        className='mt-2 text-xs text-muted-foreground hover:text-foreground'
                                    >
                                        Пометить прочитанным
                                    </button>
                                )}
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
