'use client'

import {useMemo, useState} from 'react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Checkbox} from '@/components/ui/checkbox'
import {ScrollArea} from '@/components/ui/scroll-area'
import {observer} from 'mobx-react-lite'
import {useSellerId} from '@/src/adapters/ui/react/stores'
import {useActiveOrders} from '../useActiveOrders'
import {CheckedIngredientsType} from '../types'

export const ShoppingListTab = observer(function ShoppingListTab() {
    const sellerId = useSellerId()
    const {allIngredients, isLoading} = useActiveOrders(sellerId)
    const [searchTerm, setSearchTerm] = useState('')
    const [checkedIngredients, setCheckedIngredients] = useState<CheckedIngredientsType>({})

    const filteredIngredients = useMemo(
        () =>
            Object.keys(allIngredients).filter(ingredient =>
                ingredient.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [allIngredients, searchTerm]
    )

    const toggle = (ingredient: string) =>
        setCheckedIngredients(prev => ({...prev, [ingredient]: !prev[ingredient]}))

    const setAll = (value: boolean) => {
        const next: CheckedIngredientsType = {}
        Object.keys(allIngredients).forEach(key => {
            next[key] = value
        })
        setCheckedIngredients(next)
    }

    const completion = (() => {
        const total = Object.keys(allIngredients).length
        if (total === 0) return 0
        const checked = Object.keys(allIngredients).filter(k => checkedIngredients[k]).length
        return Math.round((checked / total) * 100)
    })()

    return (
        <Card>
            <CardHeader>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div>
                        <CardTitle>Список покупок</CardTitle>
                        <CardDescription>Все ингредиенты, необходимые для ожидающих заказов</CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='text-sm text-muted-foreground'>Выполнено: {completion}%</div>
                        <div className='w-24 h-2 bg-muted rounded-full overflow-hidden'>
                            <div className='h-full bg-primary' style={{width: `${completion}%`}}/>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className='mb-4'>
                    <Input
                        placeholder='Поиск ингредиентов...'
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className='flex justify-between mb-2'>
                    <Button variant='outline' size='sm' onClick={() => setAll(true)}>
                        Отметить все
                    </Button>
                    <Button variant='outline' size='sm' onClick={() => setAll(false)}>
                        Снять все отметки
                    </Button>
                </div>

                <ScrollArea className='h-[400px] pr-4'>
                    <div className='space-y-4'>
                        {isLoading && (
                            <div className='text-center py-8 text-muted-foreground'>Загрузка...</div>
                        )}

                        {!isLoading && filteredIngredients.map(ingredient => (
                            <div
                                key={ingredient}
                                className={`flex items-start p-3 rounded-lg border ${
                                    checkedIngredients[ingredient] ? 'bg-muted/50 border-muted' : 'bg-card'
                                }`}
                            >
                                <Checkbox
                                    id={`check-${ingredient}`}
                                    checked={checkedIngredients[ingredient]}
                                    onCheckedChange={() => toggle(ingredient)}
                                    className='mt-1'
                                />
                                <div className='ml-3 flex-1'>
                                    <Label
                                        htmlFor={`check-${ingredient}`}
                                        className={`font-medium ${
                                            checkedIngredients[ingredient] ? 'line-through text-muted-foreground' : ''
                                        }`}
                                    >
                                        {ingredient}
                                    </Label>
                                    <div className='text-sm text-muted-foreground mt-1'>
                                        <span>Необходимо для {allIngredients[ingredient]?.orders.size || 0} заказов</span>
                                        <div className='mt-1'>
                                            <Badge variant='outline'>
                                                {(allIngredients[ingredient]?.amounts.reduce((a, b) => a + b, 0) ?? 0).toFixed(2)}{' '}
                                                {allIngredients[ingredient]?.unit}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!isLoading && filteredIngredients.length === 0 && (
                            <div className='text-center py-8 text-muted-foreground'>
                                Ингредиенты не соответствуют вашему поиску
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
})
