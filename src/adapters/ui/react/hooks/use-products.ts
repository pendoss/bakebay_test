'use client'

import {useEffect, useRef, useState} from 'react'
import type {Product} from '@/src/domain/product'
import type {ProductListFilters} from '@/src/application/ports/product-storage'
import {productStorageHttp} from '@/src/adapters/storage/http/product-storage-http'

export interface UseProductsResult {
    products: Product[]
    loading: boolean
    error: string | null
    refresh: () => void
}

export function useProducts(filters: ProductListFilters): UseProductsResult {
    const storage = useRef(productStorageHttp())
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [trigger, setTrigger] = useState(0)

    const deps = [filters.categoryName ?? '', filters.sellerId ?? ''].join('|')

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)
        storage.current
            .list(filters)
            .then((list) => {
                if (!cancelled) setProducts(list)
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deps, trigger])

    return {products, loading, error, refresh: () => setTrigger((t) => t + 1)}
}

interface LoadedProductState {
    forId: number | null
    product: Product | null
}

export function useProduct(id: number | null) {
    const storage = useRef(productStorageHttp())
    const [state, setState] = useState<LoadedProductState>({forId: null, product: null})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id === null) return
        let cancelled = false
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true)
        setError(null)
        storage.current
            .findById(id as unknown as Product['id'])
            .then((p) => {
                if (!cancelled) setState({forId: id, product: p})
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [id])

    const product = id !== null && state.forId === id ? state.product : null
    return {product, loading, error}
}
