'use client'

import {useEffect, useState} from 'react'
import {productStorageHttp} from '@/src/adapters/storage/http/product-storage-http'
import type {Product} from '@/src/domain/product'
import {asProductId, asSellerId} from '@/src/domain/shared/id'

export interface ProductReview {
    id: number
    rating: number
    comment: string
    created_at: string | Date | null
    customer: { name: string }
}

export interface ProductSellerInfo {
    seller_id: number
    seller_name: string
    seller_rating: number | null
    location: string | null
    created_at: string | Date | null
}

export interface ProductDetailData {
    product: Product | null
    seller: ProductSellerInfo | null
    reviews: ProductReview[]
    related: Product[]
}

export type ProductDetailStatus = 'loading' | 'found' | 'not-found' | 'error'

export interface UseProductDetailResult extends ProductDetailData {
    status: ProductDetailStatus
    error: string | null
}

export function useProductDetail(id: number | null): UseProductDetailResult {
    const [status, setStatus] = useState<ProductDetailStatus>('loading')
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<ProductDetailData>({
        product: null,
        seller: null,
        reviews: [],
        related: [],
    })

    useEffect(() => {
        if (id === null || Number.isNaN(id)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStatus('not-found')
            return
        }
        let cancelled = false
        setStatus('loading')
        setError(null)

        const storage = productStorageHttp()
        storage
            .findById(asProductId(id))
            .then(async (product) => {
                if (cancelled) return
                if (!product) {
                    setStatus('not-found')
                    return
                }

                const [sellerRes, reviewsRes, relatedList] = await Promise.all([
                    product.sellerId
                        ? fetch(`/api/sellers?id=${product.sellerId}`).then((r) => (r.ok ? r.json() : null))
                        : Promise.resolve(null),
                    fetch(`/api/reviews?productId=${product.id}`).then((r) => (r.ok ? r.json() : [])),
                    product.sellerId
                        ? storage.list({sellerId: asSellerId(product.sellerId)})
                        : Promise.resolve([] as Product[]),
                ])

                if (cancelled) return
                setData({
                    product,
                    seller: sellerRes as ProductSellerInfo | null,
                    reviews: Array.isArray(reviewsRes) ? (reviewsRes as ProductReview[]) : [],
                    related: relatedList.filter((p) => p.id !== product.id).slice(0, 4),
                })
                setStatus('found')
            })
            .catch((err: unknown) => {
                if (cancelled) return
                setError(err instanceof Error ? err.message : 'Failed to load')
                setStatus('error')
            })

        return () => {
            cancelled = true
        }
    }, [id])

    return {...data, status, error}
}
