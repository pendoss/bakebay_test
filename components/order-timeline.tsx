import { Check, Clock } from "lucide-react"
import React, {JSX} from "react";

// Define the OrderStatus type to match the one in other files
type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

// Переводы статусов заказа
const statusTranslations: Record<OrderStatus, string> = {
    placed: "Оформлен",
    confirmed: "Подтвержден",
    preparing: "Готовится",
    shipping: "Доставляется",
    delivered: "Доставлен",
    cancelled: "Отменен",
}

// Иконки для статусов
const statusIcons: Record<OrderStatus, JSX.Element> = {
    placed: <Clock className="h-4 w-4" />,
    confirmed: <Check className="h-4 w-4" />,
    preparing: <Clock className="h-4 w-4" />,
    shipping: <Clock className="h-4 w-4" />,
    delivered: <Check className="h-4 w-4" />,
    cancelled: <Clock className="h-4 w-4" />,
}

// Цвета для статусов
const statusColors: Record<OrderStatus, string> = {
    placed: "bg-lemon-meringue border-lemon-meringue text-secondary",
    confirmed: "bg-lavender-dessert border-lavender-dessert text-secondary",
    preparing: "bg-mint-frosting border-mint-frosting text-secondary",
    shipping: "bg-caramel-light border-caramel-light text-secondary",
    delivered: "bg-strawberry-cream border-strawberry-cream text-secondary",
    cancelled: "bg-muted border-muted text-muted-foreground",
}


interface OrderTimelineProps {
    statusHistory: Array<{
        status: OrderStatus
        completed?: boolean
        date?: string | null
    }>
}
export function OrderTimeline({ statusHistory } : OrderTimelineProps) {
    // Определяем текущий статус
    const currentStatus =
        statusHistory.find((status) => !status.completed)?.status || statusHistory[statusHistory.length - 1].status

    // Проверяем, отменен ли заказ
    const isCancelled = currentStatus === "cancelled"

    // Создаем массив всех возможных статусов для отображения
    const allStatuses: OrderStatus[] = isCancelled
        ? ["placed", "confirmed", "cancelled"]
        : ["placed", "confirmed", "preparing", "shipping", "delivered"]

    return (
        <div className="relative mt-6">
            {/* Линия соединяющая точки */}
            <div className="absolute left-3.5 top-3 h-full w-0.5 bg-muted"></div>

            <div className="space-y-8">
                {allStatuses.map((status) => {
                    // Находим информацию о статусе в истории
                    const statusInfo = statusHistory.find((item) => item.status === status)
                    const isCompleted = statusInfo?.completed || false
                    const isActive = currentStatus === status

                    // Если заказ отменен и текущий статус не "отменен" или "оформлен", пропускаем
                    if (isCancelled && !["placed", "confirmed", "cancelled"].includes(status)) {
                        return null
                    }

                    return (
                        <div key={status} className="relative flex items-start">
                            {/* Точка на временной шкале */}
                            <div
                                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                                    isCompleted
                                        ? statusColors[status]
                                        : isActive
                                            ? "bg-background border-primary"
                                            : "bg-background border-muted"
                                }`}
                            >
                                {isCompleted && React.cloneElement(statusIcons[status], {
                                    className: `h-3.5 w-3.5 ${statusColors[status].includes("text-secondary") ? "text-secondary" : "text-muted-foreground"}`
                                })}
                                {isActive && !isCompleted && <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>}
                            </div>

                            {/* Информация о статусе */}
                            <div className="ml-4 min-w-0">
                                <div className="flex items-center">
                                    <p
                                        className={`font-medium ${
                                            isCompleted
                                                ? status === "cancelled"
                                                    ? "text-muted-foreground"
                                                    : "text-foreground"
                                                : isActive
                                                    ? "text-foreground"
                                                    : "text-muted-foreground"
                                        }`}
                                    >
                                        {statusTranslations[status]}
                                    </p>
                                    {isActive && !isCompleted && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Текущий статус
                    </span>
                                    )}
                                </div>
                                {statusInfo?.date && <p className="text-sm text-muted-foreground">{statusInfo.date}</p>}
                                {isActive && !isCompleted && !statusInfo?.date && status !== "cancelled" && (
                                    <p className="text-sm text-muted-foreground">Ожидается</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
