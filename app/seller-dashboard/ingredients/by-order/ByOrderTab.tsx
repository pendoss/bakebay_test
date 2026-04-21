'use client'

import {useState} from 'react'
import {CheckCircle} from 'lucide-react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Checkbox} from '@/components/ui/checkbox'
import {Separator} from '@/components/ui/separator'
import {StatusBadge} from '@/components/StatusBadge'
import {observer} from 'mobx-react-lite'
import {useSellerId} from '@/src/adapters/ui/react/stores'
import {useActiveOrders} from '../useActiveOrders'
import {CheckedIngredientsType} from '../types'

export const ByOrderTab = observer(function ByOrderTab() {
    const sellerId = useSellerId()
    const {activeOrders, isLoading} = useActiveOrders(sellerId)
    const [checked, setChecked] = useState<CheckedIngredientsType>({})

    if (isLoading) {
        return <div className='text-center py-8 text-muted-foreground'>Загрузка...</div>
    }

    if (activeOrders.length === 0) {
        return (
            <div className='text-center py-12'>
                <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4'>
                    <CheckCircle className='h-6 w-6 text-muted-foreground'/>
                </div>
                <h3 className='text-lg font-medium'>Нет активных заказов</h3>
                <p className='text-muted-foreground mt-1'>Все текущие заказы обработаны</p>
            </div>
        )
    }

    return (
        <div className='space-y-4'>
            {activeOrders.map(order => (
                <Card key={order.id}>
                    <CardHeader>
                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                            <div>
                                <CardTitle>{order.id}</CardTitle>
                            </div>
                            <StatusBadge status={order.status ?? ''} type='order'/>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-4'>
                            {order.items.map((item, itemIndex) => (
                                <div key={itemIndex}>
                                    <h4 className='font-medium mb-2'>
                                        {item.name} × {item.quantity}
                                    </h4>
                                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4'>
                                        {item.ingredients.map((ingredient, ingredientIndex) => {
                                            const key = `${order.id}:${item.name}:${ingredient.name}`
                                            const totalAmount =
                                                (parseFloat(String(ingredient.amount)) || 0) * (item.quantity || 1)

                                            return (
                                                <div
                                                    key={ingredientIndex}
                                                    className='flex items-center p-2 rounded-md border bg-muted/30'
                                                >
                                                    <div className='flex-1'>
                                                        <div className='font-medium text-sm'>{ingredient.name}</div>
                                                        <div className='text-xs text-muted-foreground'>
                                                            {totalAmount.toFixed(2)} {ingredient.unit}
                                                        </div>
                                                    </div>
                                                    <Checkbox
                                                        checked={checked[key] ?? false}
                                                        onCheckedChange={() =>
                                                            setChecked(prev => ({...prev, [key]: !prev[key]}))
                                                        }
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {itemIndex < order.items.length - 1 && <Separator className='my-4'/>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
})
