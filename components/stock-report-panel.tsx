'use client'

import {Badge} from '@/components/ui/badge'
import {useSellerOrderStockReport, type StockLineStatus} from '@/src/adapters/ui/react/hooks/use-seller-order-stock-report'

interface StockReportPanelProps {
    sellerOrderId: number
    title?: string
}

const OVERALL_LABEL: Record<StockLineStatus, string> = {
    available: 'Достаточно ингредиентов',
    low: 'Осталось мало',
    missing: 'Не хватает',
}

const OVERALL_VARIANT: Record<StockLineStatus, 'secondary' | 'outline' | 'destructive'> = {
    available: 'secondary',
    low: 'outline',
    missing: 'destructive',
}

const LINE_LABEL: Record<StockLineStatus, string> = {
    available: 'хватит',
    low: 'впритык',
    missing: 'не хватит',
}

export function StockReportPanel({sellerOrderId, title = 'Готовность к выполнению'}: StockReportPanelProps) {
    const {report, loading, error} = useSellerOrderStockReport(sellerOrderId)

    if (loading && !report) {
        return <p className='text-xs text-muted-foreground'>Проверяем остатки…</p>
    }
    if (error) {
        return <p className='text-xs text-destructive'>Не удалось загрузить отчёт по складу.</p>
    }
    if (!report || report.lines.length === 0) {
        return <p className='text-xs text-muted-foreground'>Нет ингредиентов в рецепте.</p>
    }

    return (
        <div className='rounded border p-3 space-y-2'>
            <div className='flex items-center justify-between'>
                <p className='text-sm font-medium'>{title}</p>
                <Badge variant={OVERALL_VARIANT[report.overall]}>{OVERALL_LABEL[report.overall]}</Badge>
            </div>
            <ul className='space-y-1'>
                {report.lines.map((line) => (
                    <li key={line.key} className='flex items-center justify-between text-xs'>
                        <span className='truncate'>{line.name}</span>
                        <span className='text-muted-foreground ml-2'>
                            нужно {line.required.toLocaleString('ru-RU')} {line.unit} · в наличии{' '}
                            {line.available.toLocaleString('ru-RU')} {line.unit}
                        </span>
                        <Badge variant={OVERALL_VARIANT[line.status]} className='ml-2'>
                            {LINE_LABEL[line.status]}
                        </Badge>
                    </li>
                ))}
            </ul>
        </div>
    )
}
