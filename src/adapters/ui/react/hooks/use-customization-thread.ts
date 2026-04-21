'use client'

import {useCallback, useEffect, useState} from 'react'

export interface OfferDTO {
    readonly id: number
    readonly version: number
    readonly priceDelta: number
    readonly spec: {
        optionSelections: number[]
        customIngredients: Array<{ name: string; unit: string; amount: number; priceDelta: number }>
        sellerNotes: string
        customerNotes: string
    }
    readonly createdAt: string
    readonly supersededByOfferId: number | null
}

export interface MessageDTO {
    readonly id: number
    readonly author: 'customer' | 'seller'
    readonly body: string
    readonly attachmentUrls: string[]
    readonly createdAt: string
}

export interface ThreadDTO {
    readonly id: number
    readonly sellerOrderItemId: number
    readonly status: 'open' | 'awaiting_seller_finalize' | 'agreed' | 'rejected'
    readonly agreedOfferId: number | null
    readonly offers: ReadonlyArray<OfferDTO>
    readonly messages: ReadonlyArray<MessageDTO>
}

export function useCustomizationThread(threadId: number | null, pollMs = 3000) {
    const [thread, setThread] = useState<ThreadDTO | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const reload = useCallback(
        async (options: { silent?: boolean } = {}) => {
            if (!threadId) return
            if (!options.silent) setLoading(true)
            try {
                const res = await fetch(`/api/customization/threads/${threadId}`, {credentials: 'include'})
                if (!res.ok) throw new Error(`Failed to load thread: ${res.status}`)
                const data = (await res.json()) as ThreadDTO
                setThread(data)
                setError(null)
            } catch (err) {
                if (!options.silent) setError(err instanceof Error ? err.message : 'failed')
            } finally {
                if (!options.silent) setLoading(false)
            }
        },
        [threadId],
    )

    useEffect(() => {
        if (!threadId) return
        void reload()
        if (pollMs <= 0) return
        const handle = setInterval(() => {
            void reload({silent: true})
        }, pollMs)
        return () => clearInterval(handle)
    }, [threadId, reload, pollMs])

    const uploadAttachments = useCallback(
        async (files: ReadonlyArray<File>): Promise<string[]> => {
            if (!threadId || files.length === 0) return []
            const urls: string[] = []
            for (const file of files) {
                const form = new FormData()
                form.append('file', file)
                const res = await fetch(`/api/customization/threads/${threadId}/attachments`, {
                    method: 'POST',
                    credentials: 'include',
                    body: form,
                })
                if (!res.ok) {
                    const err = (await res.json().catch(() => ({}))) as { error?: string }
                    throw new Error(err.error ?? `Upload failed (${res.status})`)
                }
                const data = (await res.json()) as { url: string }
                urls.push(data.url)
            }
            return urls
        },
        [threadId],
    )

    const postMessage = useCallback(
        async (body: string, files: ReadonlyArray<File> = []) => {
            if (!threadId) return
            const attachmentUrls = await uploadAttachments(files)
            await sendJson(`/api/customization/threads/${threadId}/messages`, {body, attachmentUrls})
            await reload()
        },
        [threadId, reload, uploadAttachments],
    )

    const submitOffer = useCallback(
        async (payload: {
            priceDelta: number
            sellerNotes: string
            optionSelections?: number[]
            customIngredients?: Array<{
                key: string
                name: string
                unit: string
                amount: number
                priceDelta: number
                saveToLibrary: boolean
            }>
        }) => {
            if (!threadId) return
            await sendJson(`/api/customization/threads/${threadId}/offers`, {
                priceDelta: payload.priceDelta,
                spec: {
                    optionSelections: payload.optionSelections ?? [],
                    customIngredients: payload.customIngredients ?? [],
                    sellerNotes: payload.sellerNotes,
                    customerNotes: '',
                },
            })
            await reload()
        },
        [threadId, reload],
    )

    const acceptOffer = useCallback(
        async (offerId: number) => {
            if (!threadId) return
            await sendJson(`/api/customization/threads/${threadId}/accept`, {offerId})
            await reload()
        },
        [threadId, reload],
    )

    const requestRevision = useCallback(
        async (note?: string) => {
            if (!threadId) return
            await sendJson(`/api/customization/threads/${threadId}/revision`, {note})
            await reload()
        },
        [threadId, reload],
    )

    const finalizeAgreement = useCallback(async () => {
        if (!threadId) return
        await sendJson(`/api/customization/threads/${threadId}/finalize`, {})
        await reload()
    }, [threadId, reload])

    return {
        thread,
        loading,
        error,
        reload,
        postMessage,
        submitOffer,
        acceptOffer,
        requestRevision,
        finalizeAgreement,
    }
}

async function sendJson(url: string, body: unknown): Promise<void> {
    const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? `Request failed (${res.status})`)
    }
}
