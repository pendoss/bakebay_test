'use client'

import {useEffect, useState} from 'react'

export interface ClientSelectionDTO {
    groupId: number
    groupName: string
    groupKind: string
    valueId: number
    label: string
    priceDelta: number
}

export interface LibraryIngredientDTO {
    id: number
    name: string
    unit: string
    defaultAmount: number
    priceDelta: number
}

export interface RecipeIngredientDTO {
    name: string
    amount: number
    unit: string
    isOptional: boolean
}

export interface SellerOrderItemContextDTO {
    item: {
        id: number
        sellerOrderId: number
        productId: number
        productName: string
        quantity: number
        unitPrice: number
    }
    optionSelections: ClientSelectionDTO[]
    recipeIngredients: RecipeIngredientDTO[]
    library: LibraryIngredientDTO[]
    viewerIsOwningSeller: boolean
}

export function useSellerOrderItemContext(itemId: number | null) {
    const [ctx, setCtx] = useState<SellerOrderItemContextDTO | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (itemId === null) return
        let cancelled = false
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load trigger
        setLoading(true)
        fetch(`/api/seller-order-items/${itemId}/context`, {credentials: 'include'})
            .then(async (res) => (res.ok ? ((await res.json()) as SellerOrderItemContextDTO) : null))
            .then((data) => {
                if (!cancelled && data) setCtx(data)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [itemId])

    return {ctx, loading}
}
