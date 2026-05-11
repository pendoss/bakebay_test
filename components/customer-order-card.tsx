'use client'

import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {SellerOrderCard} from '@/components/seller-order-card'
import type {CustomerOrderDTO} from '@/src/adapters/ui/react/hooks/use-customer-orders'

const DERIVED_LABEL: Record<string, string> = {
    negotiating: 'Согласование',
    awaiting_payment: 'Ожидает оплаты',
    partially_paid: 'Частично оплачен',
    in_fulfillment: 'В работе',
    partially_delivered: 'Частично доставлен',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
    partially_cancelled: 'Частично отменён',
}

interface CustomerOrderCardProps {
    root: CustomerOrderDTO
    onChanged?: () => void
}

export function CustomerOrderCard({root, onChanged}: CustomerOrderCardProps) {
    const total = root.sellerOrders.reduce((sum, s) => sum + s.pricing.total, 0)
    const derivedLabel = DERIVED_LABEL[root.derivedStatus] ?? root.derivedStatus

    return (
        <Card className='overflow-hidden border-lavender-dessert/40'>
            <CardHeader className='p-4 pb-2'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                    <div className='flex items-center gap-2'>
                        <h3 className='font-semibold text-lg'>Заказ #{root.id}</h3>
                        <Badge variant='outline'>{derivedLabel}</Badge>
                    </div>
                    <div className='text-right'>
                        <div className='font-semibold'>{total.toFixed(2)} руб.</div>
                        <div className='text-sm text-muted-foreground'>
                            {root.sellerOrders.length === 1
                                ? '1 продавец'
                                : `${root.sellerOrders.length} продавцов`}
                        </div>
                    </div>
                </div>
                <div className='text-sm text-muted-foreground'>
                    Адрес: {root.address} · {new Date(root.createdAt).toLocaleDateString('ru-RU')}
                </div>
            </CardHeader>
            <CardContent className='p-4 pt-2 space-y-3'>
                {root.sellerOrders.map((sub) => (
                    <SellerOrderCard key={sub.id} sub={sub} onChanged={onChanged}/>
                ))}
            </CardContent>
        </Card>
    )
}
