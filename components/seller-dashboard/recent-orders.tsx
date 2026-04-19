'use client'

import {Avatar, AvatarFallback} from '@/components/ui/avatar'
import {StatusBadge} from '@/components/StatusBadge'
import {formatPrice, formatDate, getInitials} from '@/lib/formatters'

interface RecentOrder {
    id: string
    date: string
    status: string | null
    customer: string
    items_count: number
    total: number
}

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
    if (orders.length === 0) {
        return <p className='text-sm text-muted-foreground text-center py-4'>Нет заказов</p>
    }

    return (
        <div className='space-y-4'>
            {orders.map(order => (
                <div key={order.id} className='flex items-center gap-4'>
                    <Avatar className='h-9 w-9'>
                        <AvatarFallback>{getInitials(order.customer)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>{order.customer}</p>
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                            <span>#{order.id}</span>
                            <span>•</span>
                            <span>{order.items_count} шт.</span>
                            <span>•</span>
                            <span>{formatDate(order.date)}</span>
                        </div>
                    </div>
                    <div className='flex flex-col items-end gap-1'>
                        <span className='font-medium text-sm'>{formatPrice(order.total)}</span>
                        <StatusBadge status={order.status ?? ''} type='order'/>
                    </div>
                </div>
            ))}
        </div>
    )
}
