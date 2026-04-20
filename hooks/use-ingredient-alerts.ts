'use client'

/**
 * useIngredientAlerts — хук продавца.
 *
 * Фаерит тост только при переходе статуса:
 *   ok/unknown → low  ⇒ ingredient_low
 *   ok/low/unknown → out ⇒ ingredient_out
 *
 * Поведение:
 *  — при первом рендере фиксирует baseline (никаких уведомлений);
 *  — dedup живёт в module-scoped Map, поэтому перемонтирование
 *    компонента (переключение вкладки «Все ингредиенты») не
 *    поднимает повторные уведомления.
 */

import {useEffect, useRef} from 'react'
import {useNotifications} from '@/contexts/notification-context'

export interface AlertableIngredient {
    ingredient_id: number
    name: string
    stock: number
    unit: string
    alert: number
    status: string // 'ok' | 'low' | 'out'
}

// ingredient_id → последний увиденный status за время работы вкладки.
const lastKnownStatus = new Map<number, string>()

export function useIngredientAlerts(ingredients: AlertableIngredient[]) {
    const {notify} = useNotifications()
    const seeded = useRef(false)

    useEffect(() => {
        if (ingredients.length === 0) return

        if (!seeded.current) {
            for (const ing of ingredients) {
                if (!lastKnownStatus.has(ing.ingredient_id)) {
                    lastKnownStatus.set(ing.ingredient_id, ing.status)
                }
            }
            seeded.current = true
            return
        }

        for (const ing of ingredients) {
            const prev = lastKnownStatus.get(ing.ingredient_id) ?? ing.status
            if (prev === ing.status) continue

            if (ing.status === 'out' && prev !== 'out') {
                notify('ingredient_out', {
                    title: 'Ингредиент закончился',
                    description: `«${ing.name}» — остаток 0 ${ing.unit}. Срочно нужна закупка.`,
                    deeplink: '/seller-dashboard/ingredients',
                })
            } else if (ing.status === 'low' && prev === 'ok') {
                notify('ingredient_low', {
                    title: 'Мало ингредиента',
                    description: `«${ing.name}» — ${ing.stock} ${ing.unit} (лимит: ${ing.alert} ${ing.unit}).`,
                    deeplink: '/seller-dashboard/ingredients',
                })
            }

            lastKnownStatus.set(ing.ingredient_id, ing.status)
        }
    }, [ingredients, notify])
}
