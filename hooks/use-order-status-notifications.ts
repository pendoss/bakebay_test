"use client"

/**
 * useOrderStatusNotifications — хук для покупателя.
 *
 * При каждом обновлении списка orders сравнивает текущие статусы
 * с сохранёнными в useRef (в рамках сессии).
 * При изменении статуса показывает уведомление с deeplink на /orders.
 *
 * Используется в app/orders/page.tsx после setOrders.
 */

import {useEffect, useRef} from "react"
import {useNotifications} from "@/contexts/notification-context"
import {ORDER_STATUS_LABELS} from "@/lib/constants/orderStatus"

export interface TrackedOrder {
    id: string
    orderStatus: string
}

export function useOrderStatusNotifications(orders: TrackedOrder[]) {
    const {notify} = useNotifications()
    // prevMap хранит последние известные статусы в памяти — персистентность между
    // сессиями не нужна: если пользователь вернулся через день, статусы уже "известны"
    const prevMap = useRef<Record<string, string> | null>(null)

    useEffect(() => {
        if (orders.length === 0) return

        const currentMap: Record<string, string> = {}
        orders.forEach(o => {
            currentMap[o.id] = o.orderStatus
        })

        if (prevMap.current === null) {
            // Первая загрузка в этой сессии — запоминаем текущее состояние, не уведомляем
            prevMap.current = currentMap
            return
        }

        for (const [id, status] of Object.entries(currentMap)) {
            const prev = prevMap.current[id]
            if (prev !== undefined && prev !== status) {
                const label = ORDER_STATUS_LABELS[status] ?? status
                notify("order_status", {
                    title: `Статус заказа #${id} обновлён`,
                    description: `Новый статус: ${label}.`,
                    deeplink: "/orders",
                })
            }
        }

        prevMap.current = currentMap
    }, [orders, notify])
}
