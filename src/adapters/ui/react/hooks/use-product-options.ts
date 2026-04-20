'use client'

import {useEffect, useState} from 'react'

export interface ProductOptionValueDTO {
    id: number
    label: string
    priceDelta: number
}

export interface ProductOptionGroupDTO {
    id: number
    name: string
    kind: 'size' | 'color' | 'flavor' | 'custom'
    required: boolean
    values: ProductOptionValueDTO[]
}

export function useProductOptions(productId: number | null) {
    const [groups, setGroups] = useState<ProductOptionGroupDTO[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (productId === null) return
        let cancelled = false
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load trigger
        setLoading(true)
        fetch(`/api/products/${productId}/options`, {credentials: 'include'})
            .then(async (res) => {
                if (!res.ok) throw new Error(`Failed to load options: ${res.status}`)
                return (await res.json()) as { groups: ProductOptionGroupDTO[] }
            })
            .then((data) => {
                if (!cancelled) {
                    setGroups(data.groups)
                    setError(null)
                }
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof Error ? err.message : 'failed')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [productId])

    return {groups, loading, error}
}
