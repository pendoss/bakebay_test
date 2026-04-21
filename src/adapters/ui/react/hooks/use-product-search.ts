'use client'

import {useEffect, useState} from 'react'
import type {Product} from '@/src/domain/product'

export interface ProductSearchHit {
    readonly product: Product
    readonly score: number
}

export interface ProductSearchPayload {
    readonly query: string
    readonly results: ReadonlyArray<ProductSearchHit>
    readonly suggestions: ReadonlyArray<ProductSearchHit>
}

interface SearchApiItem {
    id: number
    name: string
    price: number
    short_desc: string
    long_desc: string
    category: string
    storage_conditions: string
    stock: number | null
    size: string | null
    shelf_life: number | null
    seller: { id: number; name: string; rating: number | null } | null
    category_info: { id: number; name: string } | null
    dietary_constraints: Array<{ name: string }>
    images: Array<{
        image_url: string;
        name: string | null;
        is_main: boolean | null;
        display_order: number | null;
        s3_key: string | null
    }>
    image: string | null
    score: number
    is_customizable?: boolean
}

function toProduct(item: SearchApiItem): Product {
    const images = item.images.map((img) => ({
        url: img.image_url,
        name: img.name ?? '',
        isMain: img.is_main ?? false,
        displayOrder: img.display_order ?? 0,
        s3Key: img.s3_key,
    }))
    return {
        id: item.id as unknown as Product['id'],
        sellerId: item.seller ? (item.seller.id as unknown as Product['sellerId']) : null,
        name: item.name,
        price: item.price,
        cost: null,
        shortDesc: item.short_desc ?? '',
        longDesc: item.long_desc ?? '',
        category: item.category ?? '',
        storageConditions: item.storage_conditions ?? '',
        stock: item.stock ?? 0,
        sku: null,
        weight: null,
        size: item.size,
        shelfLife: item.shelf_life,
        trackInventory: true,
        lowStockAlert: false,
        status: 'active',
        categoryId: item.category_info?.id ?? null,
        dietary: item.dietary_constraints.map((d) => d.name),
        images,
        mainImage: item.image,
        seller: item.seller
            ? {
                id: item.seller.id as unknown as Product['sellerId'] extends null ? never : NonNullable<Product['seller']>['id'],
                name: item.seller.name,
                rating: item.seller.rating,
            }
            : null,
        categoryInfo: item.category_info,
        rating: item.seller?.rating ?? 4.5,
        isCustomizable: item.is_customizable ?? false,
    }
}

function parseHits(raw: SearchApiItem[] | undefined): ProductSearchHit[] {
    if (!raw) return []
    return raw.map((item) => ({product: toProduct(item), score: item.score}))
}

export function useProductSearch(query: string, debounceMs = 250) {
    const [payload, setPayload] = useState<ProductSearchPayload | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const trimmed = query.trim()
        if (trimmed.length === 0) {
            setPayload(null)
            setError(null)
            setLoading(false)
            return
        }

        let cancelled = false
        const timer = setTimeout(async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`/api/products?q=${encodeURIComponent(trimmed)}`, {
                    credentials: 'include',
                })
                if (!res.ok) throw new Error(`Search failed (${res.status})`)
                const data = (await res.json()) as {
                    query: string
                    results: SearchApiItem[]
                    suggestions: SearchApiItem[]
                }
                if (!cancelled) {
                    setPayload({
                        query: data.query,
                        results: parseHits(data.results),
                        suggestions: parseHits(data.suggestions),
                    })
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Search failed')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }, debounceMs)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [query, debounceMs])

    return {payload, loading, error}
}
