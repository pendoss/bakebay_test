'use client'

import {useEffect, useState} from 'react'
import {getOrderIds, getOrdersDetails, OrderDetails} from '@/app/actions/getOrders'
import {AllIngredientsType} from './types'

export function useActiveOrders(sellerId: number | null | undefined) {
    const [activeOrders, setActiveOrders] = useState<OrderDetails[]>([])
    const [allIngredients, setAllIngredients] = useState<AllIngredientsType>({})
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        async function load() {
            setIsLoading(true)
            try {
                const {orderIds} = await getOrderIds(sellerId)
                const {orderDetails: orders} = await getOrdersDetails(orderIds.map(o => o.orderId))
                if (cancelled) return

                const processing = orders.filter(o => o.status === 'ordering')
                setActiveOrders(processing)

                const ingredients: AllIngredientsType = {}
                processing.forEach(order => {
                    order.items.forEach(item => {
                        if (item.quantity === null) return
                        item.ingredients.forEach(ingredient => {
                            if (ingredient.name === null) return
                            if (!ingredients[ingredient.name]) {
                                ingredients[ingredient.name] = {
                                    amounts: [],
                                    orders: new Set(),
                                    unit: ingredient.unit ?? '',
                                }
                            }
                            const amount = ingredient.amount !== null ? +ingredient.amount : 0
                            ingredients[ingredient.name].amounts.push(amount * (item.quantity ?? 1))
                            ingredients[ingredient.name].orders.add(order.id !== null ? String(order.id) : '')
                        })
                    })
                })
                setAllIngredients(ingredients)
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [sellerId])

    return {activeOrders, allIngredients, isLoading}
}
