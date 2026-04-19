import {Badge} from '@/components/ui/badge'
import {ORDER_STATUS_LABELS, ORDER_STATUS_VARIANTS} from '@/lib/constants/orderStatus'

const STOCK_LABELS: Record<string, string> = {
    ok: 'В норме',
    low: 'Мало',
    out: 'Нет',
}

const STOCK_CLASSES: Record<string, string> = {
    ok: 'bg-green-100 text-green-800',
    low: 'bg-yellow-100 text-yellow-800',
    out: 'bg-red-100 text-red-800',
}

interface StatusBadgeProps {
  status: string
    type: 'order' | 'stock'
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
    if (type === 'order') {
        return (
            <Badge variant={ORDER_STATUS_VARIANTS[status] ?? 'outline'}>
                {ORDER_STATUS_LABELS[status] ?? status}
            </Badge>
        )
    }
    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STOCK_CLASSES[status] ?? 'bg-gray-100 text-gray-800'}`}>
			{STOCK_LABELS[status] ?? status}
		</span>
    )
}
