'use client'

import {useCallback, useEffect, useState} from 'react'

export interface ChatInboxItem {
    readonly threadId: number
    readonly sellerOrderId: number
    readonly sellerOrderItemId: number
    readonly productName: string
    readonly quantity: number
    readonly status: 'open' | 'awaiting_seller_finalize' | 'agreed' | 'rejected'
    readonly sellerOrderStatus: string
    readonly counterpart: string
    readonly lastMessage: {
        author: 'customer' | 'seller'
        body: string
        hasAttachments: boolean
        createdAt: string
    } | null
    readonly updatedAt: string | null
}

export interface ChatInboxPayload {
    readonly viewerRole: 'customer' | 'seller'
    readonly threads: ReadonlyArray<ChatInboxItem>
    readonly viewerSellerName: string | null
}

export function useChatInbox(pollMs = 3000) {
    const [payload, setPayload] = useState<ChatInboxPayload | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const reload = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const res = await fetch('/api/customization/threads', {credentials: 'include'})
            if (!res.ok) throw new Error(`Failed to load inbox: ${res.status}`)
            const data = (await res.json()) as ChatInboxPayload
            setPayload(data)
            setError(null)
        } catch (err) {
            if (!silent) setError(err instanceof Error ? err.message : 'failed')
        } finally {
            if (!silent) setLoading(false)
        }
    }, [])

    useEffect(() => {
        void reload()
        if (pollMs <= 0) return
        const handle = setInterval(() => void reload(true), pollMs)
        return () => clearInterval(handle)
    }, [reload, pollMs])

    return {payload, loading, error, reload}
}
