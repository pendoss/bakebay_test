"use client"

import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const STATUS_LABELS: Record<string, string> = {
    ordering: "Оформляется",
    processing: "В обработке",
    payed: "Оплачен",
    processed: "Обработан",
    in_progress: "Готовится",
    delivering: "Доставляется",
    delivered: "Доставлен",
}

const STATUS_VARIANT: Record<string, "outline" | "secondary" | "default" | "destructive"> = {
    ordering: "outline",
    processing: "outline",
    payed: "secondary",
    processed: "secondary",
    in_progress: "secondary",
    delivering: "default",
    delivered: "default",
}

interface RecentOrder {
    id: string
    date: string
    status: string | null
    customer: string
    items_count: number
    total: number
}

function initials(name: string) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export function RecentOrders({ orders }: { orders: RecentOrder[] }) {
    if (orders.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">Нет заказов</p>
    }

    return (
        <div className="space-y-4">
            {orders.map(order => (
                <div key={order.id} className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(order.customer)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{order.customer}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>#{order.id}</span>
                            <span>•</span>
                            <span>{order.items_count} шт.</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(order.date), { addSuffix: true, locale: ru })}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="font-medium text-sm">{order.total.toLocaleString('ru-RU')} ₽</span>
                        <Badge variant={STATUS_VARIANT[order.status ?? ''] ?? 'outline'} className="text-xs">
                            {STATUS_LABELS[order.status ?? ''] ?? order.status}
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    )
}
