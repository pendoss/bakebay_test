'use client'

import {useState} from 'react'
import {TrendingDown, TrendingUp} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {
    computeMinPurchaseCost,
    computeMaxProfit,
    MinPurchaseResult,
    MaxProfitResult,
} from '@/app/actions/computeOptimization'
import {formatPrice} from '@/lib/formatters'
import {useUser} from '@/contexts/user-context'

type Mode = 'min-purchase' | 'max-profit'

export function OptimizationTab() {
    const {sellerId} = useUser()
    const [mode, setMode] = useState<Mode>('min-purchase')
    const [loading, setLoading] = useState(false)
    const [minPurchaseResult, setMinPurchaseResult] = useState<MinPurchaseResult | null>(null)
    const [maxProfitResult, setMaxProfitResult] = useState<MaxProfitResult | null>(null)

    const handleCompute = async () => {
        if (!sellerId) return
        setLoading(true)
        try {
            if (mode === 'min-purchase') {
                const result = await computeMinPurchaseCost(sellerId)
                setMinPurchaseResult(result)
                setMaxProfitResult(null)
            } else {
                const result = await computeMaxProfit(sellerId)
                setMaxProfitResult(result)
                setMinPurchaseResult(null)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>LP-оптимизация</CardTitle>
                <CardDescription>Рассчитайте минимальные закупки или максимальную прибыль</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='flex gap-2'>
                    <Button
                        variant={mode === 'min-purchase' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setMode('min-purchase')}
                    >
                        <TrendingDown className='h-4 w-4 mr-1'/>
                        Минимум закупок
                    </Button>
                    <Button
                        variant={mode === 'max-profit' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => setMode('max-profit')}
                    >
                        <TrendingUp className='h-4 w-4 mr-1'/>
                        Максимум прибыли
                    </Button>
                </div>

                <Button onClick={handleCompute} disabled={loading || !sellerId}>
                    {loading ? 'Рассчитывается...' : 'Рассчитать'}
                </Button>

                {minPurchaseResult && <MinPurchaseResultView result={minPurchaseResult}/>}
                {maxProfitResult && <MaxProfitResultView result={maxProfitResult}/>}
            </CardContent>
        </Card>
    )
}

function MinPurchaseResultView({result}: { result: MinPurchaseResult }) {
    return (
        <div className='space-y-3'>
            {result.warning && <p className='text-sm text-yellow-600'>{result.warning}</p>}
            <div className='flex items-center gap-3'>
                <p className='font-semibold'>Итог: {formatPrice(result.total_cost)}</p>
            </div>
            <div className='rounded-md border overflow-x-auto'>
                <div className='grid grid-cols-5 gap-2 p-3 font-medium border-b text-sm bg-muted/40 min-w-[600px]'>
                    <div>Ингредиент</div>
                    <div className='text-right'>Нужно</div>
                    <div className='text-right'>Склад</div>
                    <div className='text-right'>Купить (упак.)</div>
                    <div className='text-right'>Стоимость</div>
                </div>
                <div className='divide-y min-w-[600px]'>
                    {result.items.map(item => (
                        <div key={item.name} className='grid grid-cols-5 gap-2 p-3 text-sm items-center'>
                            <div className='font-medium'>{item.name}</div>
                            <div className='text-right text-muted-foreground'>
                                {item.needed.toFixed(2)} {item.unit}
                            </div>
                            <div className='text-right text-muted-foreground'>
                                {item.stock.toFixed(2)} {item.unit}
                            </div>
                            <div className='text-right'>
                                {item.packages_to_buy > 0 ? `${item.packages_to_buy} шт.` : '— (хватит)'}
                            </div>
                            <div className='text-right font-medium'>
                                {item.cost > 0 ? formatPrice(item.cost) : '0 ₽'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function MaxProfitResultView({result}: { result: MaxProfitResult }) {
    return (
        <div className='space-y-3'>
            <p className='font-semibold'>Макс. выручка: {formatPrice(result.max_revenue)}</p>
            <div className='rounded-md border overflow-x-auto'>
                <div className='grid grid-cols-5 gap-2 p-3 font-medium border-b text-sm bg-muted/40 min-w-[600px]'>
                    <div>Продукт</div>
                    <div className='text-right'>Заказано</div>
                    <div className='text-right'>Выполнить</div>
                    <div className='text-right'>Выручка</div>
                    <div>Лимит</div>
                </div>
                <div className='divide-y min-w-[600px]'>
                    {result.items.map(item => (
                        <div key={item.name} className='grid grid-cols-5 gap-2 p-3 text-sm items-center'>
                            <div className='font-medium'>{item.name}</div>
                            <div className='text-right text-muted-foreground'>{item.ordered_qty} шт.</div>
                            <div className='text-right'>{item.fulfill_qty} шт.</div>
                            <div className='text-right font-medium'>{formatPrice(item.revenue)}</div>
                            <div className='text-muted-foreground text-xs'>
                                {item.fulfill_qty >= item.ordered_qty
                                    ? '✓'
                                    : item.limiting_ingredient
                                        ? `Мало: ${item.limiting_ingredient}`
                                        : 'Недостаток'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
