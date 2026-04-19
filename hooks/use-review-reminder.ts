"use client"

/**
 * useReviewReminder — хук для покупателя.
 *
 * Проверяет заказы со статусом "delivered". Если заказ был доставлен
 * более 2 дней назад и напоминание ещё не показывалось — показывает
 * уведомление с предложением оставить отзыв.
 *
 * Показанные напоминания сохраняются в localStorage, чтобы не повторять.
 */

import {useEffect, useRef} from "react"
import {useNotifications} from "@/contexts/notification-context"

const STORAGE_KEY = "bb_review_reminders_shown"
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

export interface DeliveredOrder {
    id: string
    orderStatus: string
    date: string  // дата заказа (формат может быть "DD MM YYYY" или ISO)
}

// noinspection NonAsciiCharacters
const RU_MONTHS: Record<string, string> = {
    "января": "01", "февраля": "02", "марта": "03", "апреля": "04",
    "мая": "05", "июня": "06", "июля": "07", "августа": "08",
    "сентября": "09", "октября": "10", "ноября": "11", "декабря": "12",
}

function parseOrderDate(dateStr: string): Date {
    // Поддержка ru-RU формата "18 апреля 2026 г." и ISO
    const ruMatch = dateStr.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})/)
    if (ruMatch) {
        const month = RU_MONTHS[ruMatch[2].toLowerCase()]
        if (month) return new Date(`${ruMatch[3]}-${month}-${ruMatch[1].padStart(2, "0")}`)
    }
    // Fallback: "DD MM YYYY" или ISO
    const parts = dateStr.split(" ")
    if (parts.length === 3 && parts[0].length <= 2) {
        return new Date(parts.reverse().join("-"))
    }
    return new Date(dateStr)
}

export function useReviewReminder(orders: DeliveredOrder[]) {
    const {notify} = useNotifications()
    const checked = useRef(false)

    useEffect(() => {
        if (orders.length === 0 || checked.current) return

        const delivered = orders.filter(o => o.orderStatus === "delivered")
        if (delivered.length === 0) return

        let shown: string[] = []
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            shown = stored ? JSON.parse(stored) : []
        } catch {
            localStorage.removeItem(STORAGE_KEY)
        }

        const shownSet = new Set(shown)
        const now = Date.now()
        const toRemind: string[] = []

        for (const order of delivered) {
            if (shownSet.has(order.id)) continue

            const deliveredDate = parseOrderDate(order.date)
            if (isNaN(deliveredDate.getTime())) continue

            if (now - deliveredDate.getTime() >= TWO_DAYS_MS) {
                toRemind.push(order.id)
            }
        }

        if (toRemind.length > 0) {
            for (const orderId of toRemind) {
                notify("review_reminder", {
                    title: `Оставьте отзыв по заказу #${orderId}`,
                    description: "Расскажите о качестве — это поможет другим покупателям!",
                    deeplink: "/orders",
                })
            }

            const updatedShown = [...shown, ...toRemind]
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedShown))
        }

        checked.current = true
    }, [orders, notify])
}
