"use client"

/**
 * useSellerNotifications — хук для продавца.
 *
 * Каждые POLL_INTERVAL миллисекунд запрашивает список orderIds продавца
 * через существующий server action getOrderIds.
 * Сравнивает с сохранёнными ID в localStorage — при появлении новых
 * показывает уведомление "Новый заказ!" с deeplink в панель заказов.
 */

import {useEffect, useRef} from "react"
import {useNotifications} from "@/contexts/notification-context"
import {getOrderIds} from "@/app/actions/getOrders"

const POLL_INTERVAL = 30_000                     // 30 секунд
const STORAGE_KEY = "bb_seller_known_order_ids" // ключ в localStorage

export function useSellerNotifications(sellerId: number | null) {
    const {notify} = useNotifications()
    const initialized = useRef(false)

    useEffect(() => {
        if (!sellerId) return

        const poll = async () => {
            try {
                const {orderIds} = await getOrderIds(sellerId)
                const currentIds = orderIds.map(o => o.orderId)
                const currentSet = new Set(currentIds)

                if (!initialized.current) {
                    // Первый запрос после монтирования — синхронизируем хранилище, не уведомляем.
                    // Это также перезаписывает устаревшие данные из предыдущей сессии.
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentIds))
                    initialized.current = true
                    return
                }

                const stored = localStorage.getItem(STORAGE_KEY)
                let knownIds: number[] = []
                try {
                    knownIds = stored ? JSON.parse(stored) : []
                } catch {
                    // Повреждённые данные — сбрасываем
                    localStorage.removeItem(STORAGE_KEY)
                }

                const knownSet = new Set(knownIds)
                const newIds = currentIds.filter(id => !knownSet.has(id))

                if (newIds.length > 0) {
                    notify("new_order", {
                        title: newIds.length === 1
                            ? `Новый заказ #${newIds[0]}!`
                            : `${newIds.length} новых заказа!`,
                        description: "Откройте панель заказов для обработки.",
                        deeplink: "/seller-dashboard/orders",
                    })
                    localStorage.setItem(STORAGE_KEY, JSON.stringify([...currentSet]))
                }
            } catch {
                // Игнорируем сетевые ошибки при поллинге
            }
        }

        poll()
        const timer = setInterval(poll, POLL_INTERVAL)
        return () => clearInterval(timer)
    }, [sellerId, notify])
}
