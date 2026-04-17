"use client"

/**
 * useSellerReviewNotifications — хук для продавца.
 *
 * Каждые POLL_INTERVAL мс запрашивает отзывы продавца через /api/reviews.
 * Сравнивает с сохранёнными ID в localStorage — при появлении новых
 * показывает уведомление с deeplink на страницу отзывов.
 */

import {useEffect, useRef} from "react"
import {useNotifications} from "@/contexts/notification-context"

const POLL_INTERVAL = 60_000
const STORAGE_KEY = "bb_seller_known_review_ids"

export function useSellerReviewNotifications(sellerId: number | null) {
    const {notify} = useNotifications()
    const initialized = useRef(false)

    useEffect(() => {
        if (!sellerId) return

        const poll = async () => {
            try {
                const resp = await fetch(`/api/reviews?sellerId=${sellerId}`)
                if (!resp.ok) return
                const data: { id: number }[] = await resp.json()
                const currentIds = data.map(r => r.id)
                const currentSet = new Set(currentIds)

                if (!initialized.current) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentIds))
                    initialized.current = true
                    return
                }

                const stored = localStorage.getItem(STORAGE_KEY)
                let knownIds: number[] = []
                try {
                    knownIds = stored ? JSON.parse(stored) : []
                } catch {
                    localStorage.removeItem(STORAGE_KEY)
                }

                const knownSet = new Set(knownIds)
                const newIds = currentIds.filter(id => !knownSet.has(id))

                if (newIds.length > 0) {
                    notify("new_review", {
                        title: newIds.length === 1
                            ? "Новый отзыв!"
                            : `${newIds.length} новых отзыва!`,
                        description: "Откройте раздел отзывов для просмотра.",
                        deeplink: "/seller-dashboard/reviews",
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
