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

// Модульный кэш на время сессии — остаётся между перемонтированиями
// (например, когда в корзине меняется lineId строки и компонент ре-маунтится).
const cache = new Map<number, ProductOptionGroupDTO[]>()
const inflight = new Map<number, Promise<ProductOptionGroupDTO[]>>()

function fetchOptions(productId: number): Promise<ProductOptionGroupDTO[]> {
    const existing = inflight.get(productId)
    if (existing) return existing
    const promise = fetch(`/api/products/${productId}/options`, {credentials: 'include'})
        .then(async (res) => {
            if (!res.ok) throw new Error(`Failed to load options: ${res.status}`)
            const data = (await res.json()) as {groups: ProductOptionGroupDTO[]}
            cache.set(productId, data.groups)
            return data.groups
        })
        .finally(() => {
            inflight.delete(productId)
        })
    inflight.set(productId, promise)
    return promise
}

export function useProductOptions(productId: number | null) {
    const [groups, setGroups] = useState<ProductOptionGroupDTO[]>(() =>
        productId !== null ? cache.get(productId) ?? [] : [],
    )
    const [loading, setLoading] = useState(() =>
        productId !== null ? !cache.has(productId) : false,
    )
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (productId === null) return
        let cancelled = false

        const cached = cache.get(productId)
        if (cached) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from cache
            setGroups(cached)
            // eslint-disable-next-line react-hooks/set-state-in-effect -- cache hit means no loading
            setLoading(false)
            return
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect -- background fetch
        setLoading(true)
        fetchOptions(productId)
            .then((data) => {
                if (!cancelled) {
                    setGroups(data)
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
