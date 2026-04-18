"use client"

/**
 * useIngredientAlerts — хук для продавца.
 *
 * При изменении списка ингредиентов проверяет каждый на статус:
 *  - "out"  → ingredient_out (критично, без автозакрытия)
 *  - "low"  → ingredient_low (предупреждение)
 *
 * Уведомления дедуплицируются в рамках сессии: один ингредиент с одним
 * статусом показывается не более одного раза до перезагрузки страницы.
 */

import {useEffect, useRef} from "react"
import {useNotifications} from "@/contexts/notification-context"

export interface AlertableIngredient {
    ingredient_id: number
    name: string
    stock: number
    unit: string
    alert: number
    status: string  // "ok" | "low" | "out"
}

export function useIngredientAlerts(ingredients: AlertableIngredient[]) {
    const {notify} = useNotifications()
    // Ключ = `${ingredient_id}-${status}` — не повторяем одно и то же
    const notified = useRef<Set<string>>(new Set())

    useEffect(() => {
        if (ingredients.length === 0) return

        for (const ing of ingredients) {
            const key = `${ing.ingredient_id}-${ing.status}`
            if (notified.current.has(key)) continue

            if (ing.status === "out") {
                notified.current.add(key)
                notify("ingredient_out", {
                    title: "Ингредиент закончился",
                    description: `«${ing.name}» — остаток 0 ${ing.unit}. Срочно нужна закупка.`,
                    deeplink: "/seller-dashboard/ingredients",
                })
            } else if (ing.status === "low") {
                notified.current.add(key)
                notify("ingredient_low", {
                    title: "Мало ингредиента",
                    description: `«${ing.name}» — ${ing.stock} ${ing.unit} (лимит: ${ing.alert} ${ing.unit}).`,
                    deeplink: "/seller-dashboard/ingredients",
                })
            }
        }
    }, [ingredients, notify])
}
