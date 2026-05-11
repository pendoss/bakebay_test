import {Check, Clock} from 'lucide-react'
import React, {JSX} from 'react'
import {OrderStatus} from '@/app/orders/page'
import {statusTranslations} from '@/components/order-card'

const statusIcons: Record<OrderStatus, JSX.Element> = {
    ordering: <Clock className='h-4 w-4'/>,
    processing: <Clock className='h-4 w-4'/>,
    payed: <Check className='h-4 w-4'/>,
    processed: <Check className='h-4 w-4'/>,
    in_progress: <Clock className='h-4 w-4'/>,
    delivering: <Clock className='h-4 w-4'/>,
    delivered: <Check className='h-4 w-4'/>,
}

const statusColors: Record<OrderStatus, string> = {
    ordering: 'bg-lemon-meringue border-lemon-meringue text-secondary',
    processing: 'bg-lavender-dessert border-lavender-dessert text-secondary',
    payed: 'bg-mint-frosting border-mint-frosting text-secondary',
    processed: 'bg-mint-frosting border-mint-frosting text-secondary',
    in_progress: 'bg-mint-frosting border-mint-frosting text-secondary',
    delivering: 'bg-caramel-light border-caramel-light text-secondary',
    delivered: 'bg-strawberry-cream border-strawberry-cream text-secondary',
}

const TIMELINE: OrderStatus[] = ['ordering', 'processing', 'payed', 'in_progress', 'delivering', 'delivered']

interface OrderTimelineProps {
    statusHistory: Array<{
        status: OrderStatus
        completed?: boolean
        date?: string | null
    }>
}

export function OrderTimeline({statusHistory}: OrderTimelineProps) {
    const currentStatus =
        statusHistory.find((status) => !status.completed)?.status ??
        statusHistory[statusHistory.length - 1]?.status ??
        'ordering'

    return (
        <div className='relative mt-6'>
            <div className='absolute left-3.5 top-3 h-full w-0.5 bg-muted'></div>

            <div className='space-y-8'>
                {TIMELINE.map((status) => {
                    const statusInfo = statusHistory.find((item) => item.status === status)
                    const isCompleted = statusInfo?.completed
                    const isActive = currentStatus === status

                    return (
                        <div key={status} className='relative flex items-start'>
                            <div
                                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                                    isCompleted
                                        ? statusColors[status]
                                        : isActive
                                            ? 'bg-background text-primary'
                                            : 'bg-background text-secondary'
                                }`}
                            >
                                {isCompleted &&
                                    React.cloneElement(statusIcons[status], {
                                        className: 'h-3.5 w-3.5 text-secondary',
                                    })}
                                {isActive && !isCompleted && (
                                    <div className='h-2 w-2 rounded-full bg-primary animate-pulse'></div>
                                )}
                            </div>
                            <div className='ml-4 min-w-0'>
                                <div className='flex items-center'>
                                    <p
                                        className={`font-medium ${
                                            isCompleted
                                                ? 'text-foreground'
                                                : isActive
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground'
                                        }`}
                                    >
                                        {statusTranslations[status]}
                                    </p>
                                    {isActive && !isCompleted && (
                                        <span
                                            className='ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                                            Текущий статус
                                        </span>
                                    )}
                                </div>
                                {statusInfo?.date && (
                                    <p className='text-sm text-muted-foreground'>{statusInfo.date}</p>
                                )}
                                {isActive && !isCompleted && !statusInfo?.date && (
                                    <p className='text-sm text-muted-foreground'>Ожидается</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
