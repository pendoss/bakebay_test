'use client'

import {useCallback, useEffect, useState} from 'react'
import type {SellerOrderDTO} from '@/src/adapters/ui/react/hooks/use-customer-orders'

export interface SellerOrderWithCustomer extends SellerOrderDTO {
    readonly customerOrderId: number
    readonly createdAt: string
    readonly customer: {
        readonly name: string
        readonly email: string | null
        readonly address: string
    } | null
}

export function useSellerOrders(pollMs = 5000) {
    const [orders, setOrders] = useState<SellerOrderWithCustomer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const reload = useCallback(async () => {
        try {
            const res = await fetch('/api/seller/seller-orders', {credentials: 'include'})
            if (!res.ok) throw new Error(`Failed to load orders: ${res.status}`)
            const data = (await res.json()) as SellerOrderWithCustomer[]
            setOrders(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'failed')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void reload()
        if (pollMs > 0) {
            const handle = setInterval(() => {
                void reload()
            }, pollMs)
            return () => clearInterval(handle)
        }
    }, [reload, pollMs])

    return {orders, loading, error, reload}
}
