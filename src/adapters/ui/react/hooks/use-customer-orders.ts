'use client'

import {useCallback, useEffect, useState} from 'react'

export interface SellerOrderItemDTO {
    readonly id: number
    readonly productId: number | null
    readonly name: string
    readonly quantity: number
    readonly unitPrice: number
    readonly customizationThreadId: number | null
}

export interface SellerOrderPricingDTO {
    readonly subtotal: number
    readonly customizationDelta: number
    readonly shipping: number
    readonly commissionRate: number
    readonly commissionAmount: number
    readonly total: number
}

export interface SellerOrderDTO {
    readonly id: number
    readonly sellerId: number
    readonly sellerName?: string | null
    readonly status: string
    readonly stockCheck: string
    readonly pricing: SellerOrderPricingDTO
    readonly cancelReason: string | null
    readonly items: ReadonlyArray<SellerOrderItemDTO>
}

export interface CustomerOrderDTO {
    readonly id: number
    readonly derivedStatus: string
    readonly address: string
    readonly paymentMethod: string
    readonly createdAt: string
    readonly sellerOrders: ReadonlyArray<SellerOrderDTO>
}

export function useCustomerOrders() {
    const [orders, setOrders] = useState<CustomerOrderDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const reload = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/customer-orders', {credentials: 'include'})
            if (!res.ok) throw new Error(`Failed to load orders: ${res.status}`)
            const data = (await res.json()) as CustomerOrderDTO[]
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
    }, [reload])

    return {orders, loading, error, reload}
}

export async function transitionSellerOrder(sellerOrderId: number, next: string): Promise<void> {
    const res = await fetch(`/api/seller-orders/${sellerOrderId}/transition`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({next}),
    })
    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? `Transition failed (${res.status})`)
    }
}

export async function cancelSellerOrder(sellerOrderId: number, reason: string): Promise<void> {
    const res = await fetch(`/api/seller-orders/${sellerOrderId}/cancel`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({reason}),
    })
    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? `Cancel failed (${res.status})`)
    }
}

export interface MockPaymentPayload {
    cardNumber?: string
    cardHolder?: string
    expiry?: string
    cvc?: string
}

export async function paySellerOrder(sellerOrderId: number, payload: MockPaymentPayload = {}): Promise<void> {
    const res = await fetch(`/api/seller-orders/${sellerOrderId}/pay`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? `Payment failed (${res.status})`)
    }
}
